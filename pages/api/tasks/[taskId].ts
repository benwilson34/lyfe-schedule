// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import dayjs from 'dayjs';
import ErrorResponse, { internalErrorResponse } from '@/models/ErrorResponse';
import { getTaskById as getTaskByIdFromDb, updateTask as updateTaskInDb, addTask as addTaskInDb } from '@/services/mongo.service';
import SuccessResponse from '@/models/SuccessResponse';

async function getTaskById() {
  // TODO
}

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
    const task = req.body;
    // TODO validate task
    const modifiedId = await updateTaskInDb(taskId, task);
    if (!modifiedId) {
      throw new Error(`Failed to update task with id "${taskId}"`);
    }
    new SuccessResponse({
      status: 200,
      title: 'Successfully updated task',
      detail: `TODO`,
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
  const didUpdate = await updateTaskInDb(taskId, task);
  if (!didUpdate) {
    // TODO send error response
  }
  
  // TODO re-enable - create new task if it repeats 
  // if (task.repeatDays) {
  //   const startDate = dayjs(task.startDate); 
  //   task.startDate = startDate.add(task.repeatDays, 'days').toDate();
  //   task.endDate = startDate.add(task.rangeDays!, 'days').toDate(); // TODO calculate rangeDays at insert-time and remove nullable from model
  //   const didCreateNewTask = await addTaskInDb(task);
  //   if (!didCreateNewTask) {
  //     // TODO send error response
  //   }
  // }

  new SuccessResponse({
    title: 'TODO',
    detail: 'TODO',
  }).send(res);
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
    }
    switch(operation.toLowerCase()) {
      case 'complete':
        completeTask(req, res);
        // TODO add to history
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
    console.log(maybeError);
    internalErrorResponse.send(res);
  }
}

async function deleteTask() {
  // TODO
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method?.toUpperCase()) {
    case 'GET':
      // getTaskById();
      break;
    case 'PATCH':
      updateTask(req, res);
      break;
    case 'PUT':
      operateOnTask(req, res);
      break;
    case 'DELETE':
      // deleteTask();
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
