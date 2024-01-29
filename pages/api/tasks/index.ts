// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { isPostponeAction, PostponeAction, type TaskDto } from '@/types/task.dto'
import type { ApiResponse } from '@/types/apiResponse';
import { getManyTasks, addTask, deleteAllTasks } from '@/services/mongo.service';
import ErrorResponse, { internalErrorResponse } from '@/models/ErrorResponse';
import SuccessResponse from '@/models/SuccessResponse';
import dayjs, { Dayjs } from 'dayjs';
import { calculateEndDate } from '@/util/task';
import { TaskDao, taskDaoToDto, taskDtoToDao } from '@/types/task.dao';
import { assign, last } from 'lodash';

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

export async function getTasksForDay(targetDay: Date, { filterOutPostponed = true }: { filterOutPostponed?: boolean } = {}): Promise<TaskDao[]> {
  const startOfTargetDay = dayjs(targetDay).startOf('day');
  const currentDay = dayjs().startOf('day');
  const targetDayIsAfterCurrentDay = startOfTargetDay.isAfter(currentDay);
  type CalculatedTaskDao = TaskDao & { lastPostponeUntilDate?: Date; };
  let tasks: CalculatedTaskDao[] = (await getManyTasks({
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
