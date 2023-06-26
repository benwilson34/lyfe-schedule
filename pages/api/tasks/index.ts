// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import type { TaskDto } from '@/types/task.dto'
import type { ApiResponse } from '@/types/apiResponse';
import { getAllTasks as getAll, addTask, deleteAllTasks } from '@/services/mongo.service';
import ErrorResponse, { internalErrorResponse } from '@/models/ErrorResponse';
import SuccessResponse from '@/models/SuccessResponse';

const sampleTasks: TaskDto[] = [
  { id: '', title: 'Vacuum rugs', timeEstimateMins: 10, startDate: new Date('2023-04-28'), rangeDays: 7, repeatDays: 14 },
  { id: '', title: 'File taxes', timeEstimateMins: 120, startDate: new Date('2023-03-12'), endDate: new Date('2023-04-28') },
  { id: '', title: 'Wash towels', timeEstimateMins: 75 },
  { id: '', title: 'Wash clothes', timeEstimateMins: 20, startDate: new Date('2023-04-26'), endDate: new Date('2023-05-06') },
  { id: '', title: 'Check that there\'s enough food in the autofeeder', timeEstimateMins: 1, startDate: new Date(), rangeDays: 1, repeatDays: 3 },
  { id: '', title: 'Clean litter box and fill fountain', timeEstimateMins: 4, startDate: new Date(), rangeDays: 1, repeatDays: 2 },
  { id: '', title: 'Take out trash, recycling, cat litter, basement trash', timeEstimateMins: 5, startDate: new Date(), rangeDays: 1, repeatIdiom: 'every sunday' },
  { id: '', title: 'Clean Pete\'s ears', timeEstimateMins: 5, startDate: new Date(), rangeDays: 2, repeatIdiom: 'every sunday' },
  { id: '', title: 'Pay rent', timeEstimateMins: 2, startDate: new Date(), rangeDays: 1, repeatIdiom: 'every day before last of the month' },
  { id: '', title: 'Venmo dad for cell phone bill', timeEstimateMins: 2, startDate: new Date(), rangeDays: 1, repeatIdiom: 'every day before last of the month' },
  { id: '', title: 'Water plants', timeEstimateMins: 5, startDate: new Date(), rangeDays: 2, repeatDays: 2 },
  { id: '', title: 'Balance budget', timeEstimateMins: 15, startDate: new Date(), rangeDays: 14, repeatIdiom: 'every sunday' },
  { id: '', title: 'Check smoke detectors', timeEstimateMins: 5, startDate: new Date(), rangeDays: 21, repeatDays: 14 },
  { id: '', title: 'Clear emails', timeEstimateMins: 30, startDate: new Date(), rangeDays: 2, repeatDays: 2 },
  { id: '', title: 'Disinfect phone', timeEstimateMins: 2, startDate: new Date(), rangeDays: 4, repeatDays: 3 },
];

function handleError(maybeError: any, res: NextApiResponse) {
  console.error(maybeError);
  internalErrorResponse.send(res);
}

async function getAllTasks(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const tasks = await getAll();
    new SuccessResponse({
      title: 'TODO',
      detail: 'TODO',
      data: tasks,
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
    // TODO validate req.body
    const id = await addTask(req.body);
    new SuccessResponse({
      title: 'TODO',
      detail: 'TODO',
      data: { taskId: id }
    }).send(res);
  } catch (maybeError: any) {
    handleError(maybeError, res);
  }
}

async function initializeTasks(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await deleteAllTasks();
    sampleTasks.forEach(async (task) => await addTask(task));
    new SuccessResponse({
      title: 'TODO',
      detail: 'TODO',
    }).send(res);
  } catch (maybeError: any) {
    handleError(maybeError, res);
  }
}

async function operateOnTasks(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
    case 'initialize':
      await initializeTasks(req, res);
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
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method?.toUpperCase()) {
    case 'GET':
      await getAllTasks(req, res);
      break;
    case 'POST':
      await addNewTask(req, res);
      break;
    case 'PUT':
      await operateOnTasks(req, res);
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
