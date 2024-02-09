// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { isPostponeAction, PostponeAction, type TaskDto } from '@/types/task.dto'
import type { ApiResponse } from '@/types/apiResponse';
import { getManyTasks, addTask, deleteAllTasks as deleteAllTasksInDb } from '@/services/mongo.service';
import ErrorResponse, { internalErrorResponse, unauthenticatedErrorResponse } from '@/models/ErrorResponse';
import SuccessResponse from '@/models/SuccessResponse';
import dayjs, { Dayjs } from 'dayjs';
import { calculateEndDate } from '@/util/task';
import { TaskDao, taskDaoToDto, taskDtoToDao } from '@/types/task.dao';
import { assign, last } from 'lodash';
import { getToken } from 'next-auth/jwt';
import { ObjectId } from 'mongodb';
import { formatDayKey } from '@/util/format';

function handleError(maybeError: any, res: NextApiResponse) {
  console.error(maybeError);
  internalErrorResponse.send(res);
}

function getLastPostponeUntilDate(task: TaskDao): Date | undefined {
  return last(task.actions?.filter((a) => isPostponeAction(a)) as PostponeAction[])?.postponeUntilDate;
}

// given list of incomplete tasks (from target day and before) and target day to project onto
// for each task in list:
//   - first determine "theoretical complete date" - today for over/due tasks, or the startDate otherwise
//   - based on the "TCD" above, count days to determine projection. Assume repeat from complete date
function getProjectedRepeatingTasksForDay(incompleteTasks: TaskDao[], targetDay: Date, currentDay: Date): TaskDao[] {
  return incompleteTasks
    .filter((task) => {
      const { startDate, repeatDays } = task;
      const lastPostponeUntilDate = getLastPostponeUntilDate(task);
      // theoretical complete date has nothing to do with targetDay!
      const theoreticalCompleteDate = dayjs(
        lastPostponeUntilDate || 
        (dayjs(startDate).isAfter(dayjs(currentDay), 'day') ? startDate : currentDay)
      ).startOf('day');
      if (!repeatDays) return false; // task.repeatDays must be >= 1 if defined
      // If the task's TCD is the same as the targetDay, the task is still open, so it doesn't need 
      //   to be projected.
      const targetIsSameDay = theoreticalCompleteDate.isSame(targetDay, 'day');
      // Assume for now that repeating tasks are being completed the first day they're open.
      //   Although it might be better to have some configurable "projection threshold value"
      //   that scales on [0,1] for [startDate,endDate].
      //   That could also be automatically tailored to the user by collecting an average over their
      //   previously completed tasks of when in the date range it was completed.
      const startOfTargetDay = dayjs(targetDay).startOf('day');
      const taskRepeatsOnTargetDay = theoreticalCompleteDate.diff(startOfTargetDay, 'day') % repeatDays === 0;
      return !targetIsSameDay && taskRepeatsOnTargetDay;
    })
    .map((task) => {
      const offsetDays = dayjs(targetDay).diff(task.startDate, 'day');
      return {
        ...task,
        startDate: dayjs(task.startDate).add(offsetDays, 'day').toDate(),
        endDate: dayjs(task.endDate).add(offsetDays, 'day').toDate(),
        isProjected: true,
      };
    });
}

export async function getTasksForDay(userId: string, targetDay: Date, { filterOutPostponed = true }: { filterOutPostponed?: boolean } = {}): Promise<TaskDao[]> {
  const startOfTargetDay = dayjs(targetDay).startOf('day');
  const currentDay = dayjs().startOf('day');
  const targetDayIsAfterCurrentDay = startOfTargetDay.isAfter(currentDay);
  type CalculatedTaskDao = TaskDao & { lastPostponeUntilDate?: Date; };
  let tasks: CalculatedTaskDao[] = (await getManyTasks(userId, {
    targetDay,
    includeCompleted: !targetDayIsAfterCurrentDay,
  }))
    .map((task) => assign(task, { 
      // task.postponeActions are in chronological order
      lastPostponeUntilDate: getLastPostponeUntilDate(task),
    }));
  if (filterOutPostponed) {
    tasks = tasks
      .filter((task) => {
        if (!task.lastPostponeUntilDate) return true;
        const lastPostponeUntilDate = dayjs(task.lastPostponeUntilDate);
        return startOfTargetDay.isSame(lastPostponeUntilDate, 'day') || startOfTargetDay.isAfter(lastPostponeUntilDate);
      });
  }
  if (targetDayIsAfterCurrentDay) {
    const tasksThatStartOnTargetDay = tasks.filter((task) => startOfTargetDay.isSame(dayjs(task.startDate), 'day'));
    const tasksPostponedToTargetDay = tasks.filter((task) => startOfTargetDay.isSame(task.lastPostponeUntilDate, 'day'));
    tasks = [
      ...tasksThatStartOnTargetDay,
      ...tasksPostponedToTargetDay,
      ...getProjectedRepeatingTasksForDay(tasks, targetDay, currentDay.toDate()),
    ];
  }
  return tasks;
}

async function getTasksForDayRange(userId: string, targetStartDay: Date, targetEndDay: Date): Promise<Record<string, TaskDao[]>> {
  const dayDiff = dayjs(targetEndDay).diff(targetStartDay, 'day') + 1; // inclusive bounds, so we'll add one
  const dayToTasksMap: Record<string, TaskDao[]> = {};
  let dayOffset = 0;
  while (dayOffset !== dayDiff) {
    const targetDay = dayjs(targetStartDay).add(dayOffset, 'day');
    const targetDayKey = formatDayKey(targetDay);
    dayToTasksMap[targetDayKey] = await getTasksForDay(userId, targetDay.toDate());
    dayOffset += 1;
  }
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
async function getMultipleTasks(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
      targetEndDay: targetEndDayString
    }: { targetDay?: string, targetStartDay?: string, targetEndDay?: string } = req.query;
    let dayTasks: Record<string, TaskDao[]> = {};
    if (targetDayString) {
      const dayKey = formatDayKey(dayjs(targetDayString));
      dayTasks[dayKey] = await getTasksForDay(userId, new Date(targetDayString));
    } else if (targetStartDayString && targetEndDayString) {
      dayTasks = await getTasksForDayRange(userId, new Date(targetStartDayString), new Date(targetEndDayString));
    }

    const dayTasksMapped = Object.fromEntries(Object.entries(dayTasks).map(([day, tasks]) => ([day, tasks.map(taskDaoToDto)])));

    new SuccessResponse({
      data: { dayTasks: dayTasksMapped },
    }).send(res);
  } catch (maybeError: any) {
    handleError(maybeError, res);
  }
}

async function addNewTask(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // auth
    const token = await getToken({ req });
    if (!token) {
      unauthenticatedErrorResponse.send(res);
      return;
    }
    const userId = token.sub!;

    const taskToAdd = assign(taskDtoToDao(req.body), {
      userId: new ObjectId(userId),
    })

    // TODO validate req.body
    const taskId = await addTask(taskToAdd);
    new SuccessResponse({
      data: { taskId }
    }).send(res);
  } catch (maybeError: any) {
    handleError(maybeError, res);
  }
}

async function deleteAllTasks(
  req: NextApiRequest,
  res: NextApiResponse,
) {
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method?.toUpperCase()) {
    case 'GET':
      await getMultipleTasks(req, res);
      break;
    case 'POST':
      await addNewTask(req, res);
      break;
    // case 'PUT':
    //   await operateOnTasks(req, res);
    //   break;
    case 'DELETE':
      await deleteAllTasks(req, res);
      break;
    default:
      new ErrorResponse({
        status: 404,
        errorCode: 'resourceNotFound',
        title: 'Resource not found',
        detail: `Can not ${req.method} ${req.url}`,
      }).send(res);
      break;
  }
}
