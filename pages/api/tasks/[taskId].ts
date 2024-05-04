// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import ErrorResponse, {
  internalErrorResponse,
  unauthenticatedErrorResponse,
  notFoundErrorResponse,
} from "@/models/ErrorResponse";
import {
  getTaskById as getTaskByIdFromDb,
  updateTask as updateTaskInDb,
  deleteTask as deleteTaskInDb,
  addTask,
} from "@/services/mongo.service";
import SuccessResponse from "@/models/SuccessResponse";
import { CreateTaskDao, convertUpdateTaskDtoToDao } from "@/types/task.dao";
import dayjs from "@/lib/dayjs";
import { stripOffset } from "@/util/date";

async function updateTask(req: NextApiRequest, res: NextApiResponse) {
  try {
    // auth
    const token = await getToken({ req });
    if (!token) {
      unauthenticatedErrorResponse.send(res);
      return;
    }
    const userId = token.sub!;

    const { taskId } = req.query;
    if (!taskId || Array.isArray(taskId)) {
      notFoundErrorResponse.send(res);
      return;
    }
    const existingTask = await getTaskByIdFromDb(taskId);
    if (!existingTask) {
      notFoundErrorResponse.send(res);
      return;
    }
    if (existingTask.userId.toString() !== userId) {
      // TODO better to lump this in with "resource not found"?
      unauthenticatedErrorResponse.send(res);
      return;
    }
    // TODO validate updateTask
    const updateTask = convertUpdateTaskDtoToDao(req.body);
    const modifiedId = await updateTaskInDb(taskId, updateTask);
    if (!modifiedId) {
      throw new Error(`Failed to update task with id "${taskId}"`);
    }
    new SuccessResponse({
      data: { taskId: modifiedId },
    }).send(res);
  } catch (error) {
    console.error(error);
    internalErrorResponse.send(res);
  }
}

async function completeTask(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { taskId } = req.query;
    if (!taskId || Array.isArray(taskId)) {
      notFoundErrorResponse.send(res);
      return;
    }

    // auth
    const token = await getToken({ req });
    if (!token) {
      unauthenticatedErrorResponse.send(res);
      return;
    }
    const userId = token.sub!;

    const task = await getTaskByIdFromDb(taskId);
    if (!task) {
      notFoundErrorResponse.send(res);
      return;
    }
    if (task.userId.toString() !== userId) {
      // TODO better to lump this in with "resource not found"?
      unauthenticatedErrorResponse.send(res);
      return;
    }

    // TODO check if task was already completed - or should we support changing the complete date after the fact?

    const { completedDate: completedDateFromReq } = req.body;
    if (!completedDateFromReq) {
      new ErrorResponse({
        status: 400,
        errorCode: "invalidFields",
        title: "Could not complete task: invalid fields",
        detail: `Could not complete the task because the \`completedDate\` field in the body was not supplied.`,
      }).send(res);
      return;
    }
    // TODO validate :)

    task.completedDate = dayjs.utc(completedDateFromReq).toDate();

    await updateTaskInDb(taskId, task);

    if (task.repeatDays) {
      const newStartDate = dayjs.utc(task.completedDate).add(
        task.repeatDays,
        "days"
      ); // should be `dayjs.utc()`?
      // there might be a better way, but this explicit approach gives me the most confidence
      const newTask: CreateTaskDao = {
        userId: task.userId,
        title: task.title,
        ...(task.timeEstimateMins && {
          timeEstimateMins: task.timeEstimateMins,
        }),
        repeatDays: task.repeatDays,
        rangeDays: task.rangeDays,
        // TODO is the logic still this straightforward if the task has useStart/EndTime === true?
        // for now, assume "repeat from completedDate"
        startDate: newStartDate.toDate(),
        endDate: newStartDate.add(task.rangeDays - 1, "days").toDate(), // minus one because range is [start of startDate, end of endDate]
      };
      const createdTaskId = await addTask(newTask);
      if (!createdTaskId) {
        // TODO send error response
      }
      new SuccessResponse({
        data: { createdTaskId },
      }).send(res);
      return;
    }

    new SuccessResponse().send(res);
  } catch (maybeError) {
    console.error(maybeError);
    internalErrorResponse.send(res);
  }
}

async function postponeTask(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { taskId } = req.query;
    if (!taskId || Array.isArray(taskId)) {
      new ErrorResponse({
        status: 404,
        errorCode: "invalidFields",
        title: "TODO",
        detail: "TODO",
      }).send(res);
      return;
    }

    // auth
    const token = await getToken({ req });
    if (!token) {
      unauthenticatedErrorResponse.send(res);
      return;
    }
    const userId = token.sub!;

    // TODO better validation - for example, you shouldn't be able to postpone to a date earlier than the task.startDate
    const { postponeUntilDate } = req.body;
    if (!postponeUntilDate) {
      new ErrorResponse({
        status: 400,
        errorCode: "invalidFields",
        title: "TODO",
        detail: "TODO",
      }).send(res);
      return;
    }

    const task = await getTaskByIdFromDb(taskId);
    if (!task) {
      notFoundErrorResponse.send(res);
      return;
    }
    if (task.userId.toString() !== userId) {
      // TODO better to include in "resource not found"?
      unauthenticatedErrorResponse.send(res);
      return;
    }
    const postponeAction = {
      timestamp: stripOffset(dayjs()).toDate(),
      postponeUntilDate: dayjs.utc(postponeUntilDate).toDate(),
    };
    if (task.actions) {
      task.actions.push(postponeAction);
    } else {
      task.actions = [postponeAction];
    }
    await updateTaskInDb(taskId, task);
    new SuccessResponse().send(res);
  } catch (maybeError) {
    console.error(maybeError);
    internalErrorResponse.send(res);
  }
}

async function operateOnTask(req: NextApiRequest, res: NextApiResponse) {
  try {
    // TODO validate body?
    const { operation, ...options } = req.body;
    if (!operation) {
      new ErrorResponse({
        status: 400,
        errorCode: "invalidFields",
        title: "TODO",
        detail: "TODO",
      }).send(res);
      return;
    }
    switch (operation.toLowerCase()) {
      case "complete":
        await completeTask(req, res);
        break;
      case "postpone":
        await postponeTask(req, res);
        break;
      default:
        new ErrorResponse({
          status: 400,
          errorCode: "invalidFields",
          title: "Invalid operation",
          detail: `The provided operation "${operation}" is not valid.`,
        }).send(res);
        return;
    }
  } catch (maybeError: any) {
    console.error(maybeError);
    internalErrorResponse.send(res);
  }
}

async function deleteTask(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { taskId } = req.query;
    if (!taskId || Array.isArray(taskId)) {
      new ErrorResponse({
        status: 400,
        errorCode: "invalidFields",
        title: "TODO",
        detail: "TODO",
      }).send(res);
      return;
    }

    // auth
    const token = await getToken({ req });
    if (!token) {
      unauthenticatedErrorResponse.send(res);
      return;
    }
    const userId = token.sub!;

    const task = await getTaskByIdFromDb(taskId);
    if (!task) {
      notFoundErrorResponse.send(res);
      return;
    }
    if (task.userId.toString() !== userId) {
      unauthenticatedErrorResponse.send(res);
      return;
    }

    await deleteTaskInDb(taskId);
    new SuccessResponse().send(res);
  } catch (maybeError: any) {
    console.error(maybeError);
    internalErrorResponse.send(res);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log(`${req.method} ${req.url}`); // TODO replace with proper logging
  switch (req.method?.toUpperCase()) {
    case "PATCH":
      await updateTask(req, res);
      break;
    case "PUT":
      await operateOnTask(req, res);
      break;
    case "DELETE":
      await deleteTask(req, res);
      break;
    default:
      new ErrorResponse({
        status: 404,
        errorCode: "resourceNotFound",
        title: "Resource not found",
        detail: `Can not ${req.method} ${req.url}`,
      }).send(res);
      break;
  }
}
