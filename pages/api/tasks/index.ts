// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { type TaskDto } from '@/types/task.dto'
import type { ApiResponse } from '@/types/apiResponse';
import { getManyTasks, addTask, deleteAllTasks } from '@/services/mongo.service';
import ErrorResponse, { internalErrorResponse } from '@/models/ErrorResponse';
import SuccessResponse from '@/models/SuccessResponse';
import dayjs, { Dayjs } from 'dayjs';
import { calculateEndDate } from '@/util/task';
import { TaskDao, taskDaoToDto, taskDtoToDao } from '@/types/task.dao';
import { startOfTheDay } from '@/util/date';

function clearTime(date: Date | Dayjs): Date {
  return dayjs(date).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0).toDate();
}

const currentDay = clearTime(new Date());

// const sampleTasks: TaskDao[] = [
//   { title: 'Vacuum rugs', timeEstimateMins: 10, startDate: new Date('2023-04-28'), rangeDays: 7, repeatDays: 14 },
//   // { id: '', title: 'File taxes', timeEstimateMins: 120, startDate: new Date('2023-03-12'), endDate: new Date('2023-04-28') },
//   // { id: '', title: 'Wash towels', timeEstimateMins: 75 },
//   // { id: '', title: 'Wash clothes', timeEstimateMins: 20, startDate: new Date('2023-04-26'), endDate: new Date('2023-05-06') },
//   { title: 'Check that there\'s enough food in the autofeeder', timeEstimateMins: 1, startDate: currentDay, rangeDays: 1, repeatDays: 3 },
//   { title: 'Clean litter box and fill fountain', timeEstimateMins: 4, startDate: currentDay, rangeDays: 1, repeatDays: 2 },
//   { title: 'Take out trash, recycling, cat litter, basement trash', timeEstimateMins: 5, startDate: currentDay, rangeDays: 1, repeatIdiom: 'every sunday' },
//   { title: 'Clean Pete\'s ears', timeEstimateMins: 5, startDate: clearTime(dayjs().subtract(1, 'day')), rangeDays: 2, repeatIdiom: 'every sunday' },
//   { title: 'Pay rent', timeEstimateMins: 2, startDate: currentDay, rangeDays: 1, repeatIdiom: 'every day before last of the month' },
//   { title: 'Venmo dad for cell phone bill', timeEstimateMins: 2, startDate: currentDay, rangeDays: 1, repeatIdiom: 'every day before last of the month' },
//   { title: 'Water plants', timeEstimateMins: 5, startDate: currentDay, rangeDays: 2, repeatDays: 2 },
//   { title: 'Balance budget', timeEstimateMins: 15, startDate: clearTime(dayjs().subtract(3, 'day')), rangeDays: 14, repeatIdiom: 'every sunday' },
//   { title: 'Check smoke detectors', timeEstimateMins: 5, startDate: clearTime(dayjs().add(7, 'day')), rangeDays: 21, repeatDays: 14 },
//   { title: 'Clear emails', timeEstimateMins: 30, startDate: clearTime(dayjs().add(1, 'day')), rangeDays: 2, repeatDays: 2 },
//   { title: 'Disinfect phone', timeEstimateMins: 2, startDate: clearTime(dayjs().subtract(2, 'day')), rangeDays: 4, repeatDays: 3 },
//   { title: 'Overdue ting', timeEstimateMins: 2, startDate: clearTime(dayjs().subtract(4, 'day')), rangeDays: 3, repeatDays: 3 },
// ];

function handleError(maybeError: any, res: NextApiResponse) {
  console.error(maybeError);
  internalErrorResponse.send(res);
}

function getProjectedRepeatingTasksForDay(incompleteTasks: TaskDao[], targetDay: Date): TaskDao[] {
  const numberOfDaysFromNow = dayjs(targetDay).diff(startOfTheDay(dayjs()), 'day') + 1;
  return incompleteTasks
    .filter((task) => {
      const { repeatDays } = task;
      if (!repeatDays) return false;
      // Assume for now that repeating tasks are being completed the first day they're open.
      //   Although it might be better to have some configurable "projection threshold value"
      //   that scales on [0,1] for [startDate,endDate].
      //   That could also be automatically tailored to the user by collecting an average over their
      //   previously completed tasks of when in the date range it was completed.
      return numberOfDaysFromNow % repeatDays === 0;
    })
    .map((task) => {
      // handle active, overdue, repeating tasks
      // TODO revisit this logic
      const daysOverEndDate = Math.max(0, dayjs().add(2, 'day').diff(task.endDate, 'day'));
      const offsetDays = numberOfDaysFromNow + daysOverEndDate - 1;
      return {
        ...task,
        startDate: dayjs(task.startDate).add(offsetDays, 'day').toDate(),
        endDate: dayjs(task.endDate).add(offsetDays, 'day').toDate(),
        isProjected: true,
      };
    });
}

// TODO is `targetEndDay` inclusive or exclusive?
// TODO should this be part of `getMultipleTasks` or should it have its own endpoint/controller?
// function getProjectedRepeatingTasksForDayRange(incompleteTasks: TaskDao[], targetStartDay: Date, targetEndDay: Date): Map<Date, TaskDao[]> {
//   const dayDiff = dayjs(targetEndDay).diff(targetStartDay, 'day');
//   let dayOffset = 0;
//   let dayToTasksMap = new Map<Date, TaskDao[]>();
//   while (dayOffset !== dayDiff) {
//     dayOffset += 1;
//     const targetDay = dayjs(targetStartDay).add(dayOffset, 'day').toDate();
//     dayToTasksMap.set(targetDay, getProjectedRepeatingTasksForDay(incompleteTasks, targetDay));
//   }
//   return dayToTasksMap;
// }

async function getTasksForDay(targetDay?: Date): Promise<TaskDao[]> {
  const targetDayIsAfterCurrentDay = !targetDay || (() => {
    const currentDay = startOfTheDay(dayjs());
    // console.log(`current day: ${currentDay}`);
    return dayjs(targetDay).isAfter(currentDay);
  })();
  let tasks = await getManyTasks({
    ...(targetDay && { targetDay }),
  });
  if (targetDay && targetDayIsAfterCurrentDay) {
    tasks = getProjectedRepeatingTasksForDay(tasks, targetDay);
  }
  return tasks;
}

async function getTasksForDayRange(targetStartDay: Date, targetEndDay: Date): Promise<Record<string, TaskDao[]>> {
  const dayDiff = dayjs(targetEndDay).diff(targetStartDay, 'day') + 1; // inclusive bounds, so we'll add one
  const dayToTasksMap: Record<string, TaskDao[]> = {};
  let dayOffset = 0;
  while (dayOffset !== dayDiff) {
    const targetDay = dayjs(targetStartDay).add(dayOffset, 'day');
    const targetDayKey = formatDayKey(targetDay);
    dayToTasksMap[targetDayKey] = await getTasksForDay(targetDay.toDate());
    dayOffset += 1;
  }
  return dayToTasksMap;
}

function formatDayKey(date: dayjs.Dayjs): string {
  return date.format('YYYY-MM-DD');
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
    // TODO validate request :)
    const { 
      targetDay: targetDayString, 
      targetStartDay: targetStartDayString, 
      targetEndDay: targetEndDayString 
    }: { targetDay?: string, targetStartDay?: string, targetEndDay?: string } = req.query;
    let dayTasks: Record<string, TaskDao[]> = {};
    if (targetDayString) {
      const dayKey = formatDayKey(dayjs(targetDayString));
      dayTasks[dayKey] = await getTasksForDay(new Date(targetDayString));
    } else if (targetStartDayString && targetEndDayString) {
      // TODO ah type checking makes a good point here. What should the response shape be? If not uniform, break out to separate controller
      dayTasks = await getTasksForDayRange(new Date(targetStartDayString), new Date(targetEndDayString));
    }

    const dayTasksMapped = Object.fromEntries(Object.entries(dayTasks).map(([day, tasks]) => ([day, tasks.map(taskDaoToDto)])));

    new SuccessResponse({
      title: 'TODO',
      detail: 'TODO',
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
    // TODO validate req.body
    // console.log(`>> about to add:`, taskDtoToDao(req.body)); // TODO remove
    const id = await addTask(taskDtoToDao(req.body));
    new SuccessResponse({
      title: 'TODO',
      detail: 'TODO',
      data: { taskId: id }
    }).send(res);
  } catch (maybeError: any) {
    handleError(maybeError, res);
  }
}

// async function initializeTasks(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   try {
//     await deleteAllTasks();
//     await Promise.all(
//       sampleTasks.map(async (task) => {
//         const t = task;
//         if (!t.endDate) {
//           t.endDate = calculateEndDate(dayjs(t.startDate || '' as string), t.rangeDays!).toDate();
//         }
//         return await addTask(task);
//       })
//     );
//     new SuccessResponse({
//       title: 'TODO',
//       detail: 'TODO',
//     }).send(res);
//   } catch (maybeError: any) {
//     handleError(maybeError, res);
//   }
// }

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
  switch (operation.toLowerCase()) {
    // case 'initialize':
    //   await initializeTasks(req, res);
    //   break;
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
      await getMultipleTasks(req, res);
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
