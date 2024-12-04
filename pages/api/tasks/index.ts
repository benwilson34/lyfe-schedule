// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getManyTasks,
  addTask,
  deleteAllTasks as deleteAllTasksInDb,
} from "@/services/mongo.service";
import ErrorResponse, {
  internalErrorResponse,
  unauthenticatedErrorResponse,
} from "@/models/ErrorResponse";
import SuccessResponse from "@/models/SuccessResponse";
import dayjs, { Dayjs } from "@/lib/dayjs";
import { getTasksForDay, getTasksForDayRange } from "@/util/task";
import {
  ActionDao,
  TaskDao,
  convertCreateTaskDtoToDao,
  convertTaskDaoToDto,
} from "@/types/task.dao";
import { assign } from "lodash";
import { getToken } from "next-auth/jwt";
import { ObjectId } from "mongodb";
import { formatDayKey } from "@/util/format";
import { getTimezoneOffsetFromHeader } from "@/util/timezoneOffset";
import { Modify } from "@/util/types";
import { isPostponeAction, TaskDto } from "@/types/task.dto";
import { getCanonicalDatestring } from "@/util/date";
import { handleUnimplementedEndpoint } from "@/util/apiResponse";
import { IS_DEMO_MODE } from "@/util/env";

function handleError(maybeError: any, res: NextApiResponse) {
  console.error(maybeError);
  internalErrorResponse.send(res);
}

type ActionDaoWithDayjs = Modify<
  ActionDao,
  {
    timestamp: Dayjs;
    postponeUntilDate?: Dayjs;
  }
>;
type TaskDaoWithDayjs = Modify<
  TaskDao,
  {
    startDate: Dayjs;
    endDate: Dayjs;
    completedDate?: Dayjs;
    actions?: ActionDaoWithDayjs[];
  }
>;

function mapTaskDaoDateFieldsToDayjs(task: TaskDao) {
  const mappedTask: TaskDaoWithDayjs = {
    ...task,
    startDate: dayjs.utc(task.startDate),
    endDate: dayjs.utc(task.endDate),
    completedDate: undefined, // hacky TS workaround
    actions: undefined, // hacky TS workaround
  };
  if (task.completedDate) {
    mappedTask.completedDate = dayjs.utc(task.completedDate);
  }
  if (task.actions) {
    mappedTask.actions = task.actions.map((action) => {
      const mappedAction: ActionDaoWithDayjs = {
        timestamp: dayjs.utc(action.timestamp),
        postponeUntilDate: undefined, // hacky TS workaound
      };
      if (isPostponeAction(action as any)) {
        // TODO fix typing
        mappedAction.postponeUntilDate = dayjs.utc(
          (action as any).postponeUntilDate
        );
      }
      return mappedAction;
    });
  }
  return mappedTask;
}

async function getStoredTasksForDay(
  userId: string,
  targetDayUtc: Dayjs,
  currentDayUtc: Dayjs,
  { filterOutPostponed = true }: { filterOutPostponed?: boolean } = {}
) {
  const startOfTargetDay = targetDayUtc.startOf("day");
  const targetDayIsAfterCurrentDay = startOfTargetDay.isAfter(currentDayUtc);
  const taskList = await getManyTasks(userId, {
    targetDay: targetDayUtc.toDate(),
    includeCompleted: !targetDayIsAfterCurrentDay,
  });
  return getTasksForDay(
    taskList.map(mapTaskDaoDateFieldsToDayjs),
    startOfTargetDay,
    currentDayUtc,
    {
      filterOutPostponed,
    }
  );
}

async function getStoredTasksForDayRange(
  userId: string,
  targetStartDayUtc: Dayjs,
  targetEndDayUtc: Dayjs,
  currentDayUtc: Dayjs
) {
  const tasks = await getManyTasks(userId, {
    targetDay: targetEndDayUtc.toDate(),
  });
  const dayToTasksMap = getTasksForDayRange(
    tasks.map(mapTaskDaoDateFieldsToDayjs),
    targetStartDayUtc,
    targetEndDayUtc,
    currentDayUtc
  );
  return dayToTasksMap;
}

/**
 * Successful response has body in this shape:
 * {
 *   dayTasks: {
 *     '2023-11-09': [{task}, {task}, ...],
 *     '2023-11-10': [{task}, ...],
 *     '2023-11-11': [{task}, ...]
 *   }
 * }
 */
async function getMultipleTasks(req: NextApiRequest, res: NextApiResponse) {
  try {
    // auth
    const token = await getToken({ req });
    if (!token) {
      unauthenticatedErrorResponse.send(res);
      return;
    }
    const userId = token.sub!;

    // TODO validate request :)
    const {
      targetDay: targetDayString,
      targetStartDay: targetStartDayString,
      targetEndDay: targetEndDayString,
      tag: withTagString = "",
    }: {
      targetDay?: string;
      targetStartDay?: string;
      targetEndDay?: string;
      tag?: string;
    } = req.query;

    const timezoneOffset = getTimezoneOffsetFromHeader(req);
    if (!timezoneOffset) {
      new ErrorResponse({
        status: 400,
        errorCode: "invalidFields",
        title: "Could not get tasks: missing timezone header",
        detail: `Could not get tasks because the required header "X-Timezone-Offset" was not provided. TODO more info.`,
      }).send(res);
      return;
    }
    const currentDay = dayjs.utc().subtract(timezoneOffset, "minute");

    const sendMappedDayTasks = (
      dayTasks: Record<string, TaskDaoWithDayjs[]>
    ) => {
      const dayTasksMapped: Record<string, TaskDto[]> = Object.fromEntries(
        Object.entries(dayTasks).map(([day, tasks]) => [
          day,
          tasks.map(convertTaskDaoToDto),
        ])
      );
      new SuccessResponse({
        data: { dayTasks: dayTasksMapped },
      }).send(res);
    };

    // handle day-task-type requests
    // TODO support filters like `withTag`
    if (targetDayString) {
      const parsedTargetDay = dayjs.utc(targetDayString);
      const dayKey = formatDayKey(parsedTargetDay);
      sendMappedDayTasks({
        [dayKey]: await getStoredTasksForDay(
          userId,
          parsedTargetDay,
          currentDay
        ),
      });
      return;
    } else if (targetStartDayString && targetEndDayString) {
      sendMappedDayTasks(
        await getStoredTasksForDayRange(
          userId,
          dayjs.utc(targetStartDayString),
          dayjs.utc(targetEndDayString),
          currentDay
        )
      );
      return;
    }

    // handle task-list-type requests
    const filter = {
      ...(withTagString.length > 0 && { withTag: withTagString }),
    };
    const tasks = (await getManyTasks(userId, filter)).map(convertTaskDaoToDto);
    new SuccessResponse({
      data: { tasks },
    }).send(res);
  } catch (maybeError: any) {
    handleError(maybeError, res);
  }
}

async function addNewTask(req: NextApiRequest, res: NextApiResponse) {
  try {
    // auth
    const token = await getToken({ req });
    if (!token) {
      unauthenticatedErrorResponse.send(res);
      return;
    }
    const userId = token.sub!;

    // TODO validate req.body
    const taskToAdd = assign(convertCreateTaskDtoToDao(req.body), {
      userId: new ObjectId(userId),
    });
    const taskId = await addTask(taskToAdd);
    new SuccessResponse({
      data: { taskId },
    }).send(res);
  } catch (maybeError: any) {
    handleError(maybeError, res);
  }
}

async function deleteAllTasks(req: NextApiRequest, res: NextApiResponse) {
  try {
    // auth
    const token = await getToken({ req });
    if (!token) {
      unauthenticatedErrorResponse.send(res);
      return;
    }
    const userId = token.sub!;

    const deletedCount = await deleteAllTasksInDb(userId);
    new SuccessResponse({ data: { deletedCount } }).send(res);
  } catch (maybeError) {
    console.error(maybeError);
    internalErrorResponse.send(res);
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`${req.method} ${req.url}`); // TODO replace with proper logging
  switch (req.method?.toUpperCase()) {
    case "GET":
      await getMultipleTasks(req, res);
      break;
    case "POST":
      await addNewTask(req, res);
      break;
    // case 'PUT':
    //   await operateOnTasks(req, res);
    //   break;
    case "DELETE":
      await deleteAllTasks(req, res);
      break;
    default:
      handleUnimplementedEndpoint(req, res);
      break;
  }
}

export default IS_DEMO_MODE ? handleUnimplementedEndpoint : handler;
