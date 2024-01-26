// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import ErrorResponse, { internalErrorResponse } from '@/models/ErrorResponse';
import { getTaskById as getTaskByIdFromDb, updateTask as updateTaskInDb, deleteTask as deleteTaskInDb, addTask } from '@/services/mongo.service';
import SuccessResponse from '@/models/SuccessResponse';
import { taskDtoToDao } from '@/types/task.dao';
import dayjs from 'dayjs';

async function updateTask(req: NextApiRequest, res: NextApiResponse) {
  // TODO wrap with try-catch
  try {
    const { taskId } = req.query;
    if (!taskId || Array.isArray(taskId)) {
      new ErrorResponse({
        status: 404,
        responseCode: 'resourceNotFound',
        title: 'TODO',
        detail: 'TODO',
      }).send(res);
      return;
    }
    const task = taskDtoToDao(req.body);
    // TODO validate task
    const modifiedId = await updateTaskInDb(taskId, task);
    if (!modifiedId) {
      throw new Error(`Failed to update task with id "${taskId}"`);
    }
    new SuccessResponse({
      data: { taskId: modifiedId }
    }).send(res);
  } catch (error) {
    console.error(error);
    internalErrorResponse.send(res);
  }
}

async function completeTask(req: NextApiRequest, res: NextApiResponse) {
  // TODO wrap with try-catch
  const { taskId } = req.query;
  if (!taskId || Array.isArray(taskId)) {
    new ErrorResponse({
      status: 404,
      responseCode: 'resourceNotFound',
      title: 'TODO',
      detail: 'TODO',
    }).send(res);
    return;
  }
  const task = await getTaskByIdFromDb(taskId);
  if (!task) {
    new ErrorResponse({
      status: 404,
      responseCode: 'resourceNotFound',
      title: 'TODO',
      detail: 'TODO',
    }).send(res);
    return;
  }
  task.completedDate = new Date();
  await updateTaskInDb(taskId, task);
  
  if (task.repeatDays) {
    delete task._id;
    // TODO is the logic still this straightforward if the task has useStart/EndTime === true?
    // for now, assume "repeat from completedDate"
    const newStartDate = dayjs(task.completedDate).add(task.repeatDays, 'days');
    task.startDate = newStartDate.toDate();
    console.log(`about to repeat task on ${task.startDate}`); // TODO remove
    task.endDate = newStartDate.add(task.rangeDays, 'days').toDate();
    delete task.completedDate;
    const createdTaskId = await addTask(task);
    if (!createdTaskId) {
      // TODO send error response
    }
    new SuccessResponse({
      data: { createdTaskId }
    }).send(res);
    return;
  }

  new SuccessResponse().send(res);
}

async function postponeTask(req: NextApiRequest, res: NextApiResponse) {
  // TODO wrap with try-catch
  const { taskId } = req.query;
  if (!taskId || Array.isArray(taskId)) {
    new ErrorResponse({
      status: 404,
      responseCode: 'resourceNotFound',
      title: 'TODO',
      detail: 'TODO',
    }).send(res);
    return;
  }
  const { postponeUntilDate } = req.body;
  // TODO better validation
  if (!postponeUntilDate) {
    new ErrorResponse({
      status: 400,
      responseCode: 'invalidFields',
      title: 'TODO',
      detail: 'TODO',
    }).send(res);
    return;
  }

  const task = await getTaskByIdFromDb(taskId);
  if (!task) {
    new ErrorResponse({
      status: 404,
      responseCode: 'resourceNotFound',
      title: 'TODO',
      detail: 'TODO',
    }).send(res);
    return;
  }
  const postponeAction = {
    timestamp: new Date(),
    postponeUntilDate: dayjs(postponeUntilDate).toDate(),
  };
  if (task.actions) {
    task.actions.push(postponeAction);
  } else {
    task.actions = [postponeAction];
  }
  await updateTaskInDb(taskId, task);
  new SuccessResponse().send(res);
}

async function operateOnTask(req: NextApiRequest, res: NextApiResponse) {
  try {
    // TODO validate body?
    const { operation, ...options } = req.body;
    if (!operation) {
      new ErrorResponse({
        status: 400,
        responseCode: 'invalidFields',
        title: 'TODO',
        detail: 'TODO',
      }).send(res);
      return;
    }
    switch(operation.toLowerCase()) {
      case 'complete':
        await completeTask(req, res);
        // TODO add to history
        break;
      case 'postpone':
        await postponeTask(req, res);
        break;
      default:
        new ErrorResponse({
          status: 400,
          responseCode: 'invalidFields',
          title: 'Invalid operation',
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
        responseCode: 'invalidFields',
        title: 'TODO',
        detail: 'TODO',
      }).send(res);
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
  switch (req.method?.toUpperCase()) {
    case 'PATCH':
      await updateTask(req, res);
      break;
    case 'PUT':
      await operateOnTask(req, res);
      break;
    case 'DELETE':
      await deleteTask(req, res);
      break;
    default:
      new ErrorResponse({
        status: 404,
        responseCode: 'resourceNotFound',
        title: 'Resource not found',
        detail: `Can not ${req.method} ${req.url}`,
      }).send(res);
      break;
  }
}
