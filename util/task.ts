import type { TaskViewModel as Task, TaskViewModel } from "@/types/task.viewModel";
import type { TaskDao, TaskDaoWithCalculatedFields } from "@/types/task.dao";
import dayjs, { Dayjs } from "@/lib/dayjs";
import { last } from "lodash";
import { PostponeAction, isPostponeAction } from "@/types/task.dto";

/**
 * Check `startDate`, `endDate`, and `rangeDays`. Two of the three should be provided, then the
 *    remaining one is calculated.
 * @param task 
 */
export function calculateDates(task: Task): Task {
  const providedValues = [task.startDate, task.endDate, task.rangeDays].filter((v) => !!v);
  if (providedValues.length !== 2) {
    throw new Error(`Exactly two of the three date range values should be provided, got ${providedValues.length}`);
  }

  const newTask: Task = {...task};
  if (newTask.startDate && newTask.endDate) {
    newTask.rangeDays = calculateRangeDays(newTask.startDate, newTask.endDate);
    return newTask;
  }
  if (newTask.startDate && newTask.rangeDays) {
    newTask.endDate = calculateEndDate(newTask.startDate, newTask.rangeDays);
    return newTask;
  }
  if (newTask.endDate && newTask.rangeDays) {
    newTask.startDate = calculateStartDate(newTask.endDate, newTask.rangeDays);
    return newTask;
  }
  throw new Error('Unexpected value'); // Shouldn't get here
}

export function calculateRangeDays(startDate: Dayjs, endDate: Dayjs, useStartTime: boolean = false, useEndTime: boolean = false): number {
  // TODO figure out how to calculate when useStartTime === true or useEndTime === true
  // When `useStartTime === false`, assume the "start time" is the beginning of the day, just after midnight.
  // When `useEndTime === false`, assume the "end time" is the end of the day, just before midnight.
  const adjustedStartDate = useStartTime ? startDate : startDate.startOf('day');
  const adjustedEndDate = useEndTime ? endDate : endDate.endOf('day').add(2, 'minutes'); // eh it works for now
  return adjustedEndDate.diff(adjustedStartDate, 'days');
}

export function calculateEndDate(startDate: Dayjs, rangeDays: number): Dayjs {
  return startDate.add(rangeDays, 'days');
}

export function calculateStartDate(endDate: Dayjs, rangeDays: number): Dayjs {
  return endDate.subtract(rangeDays, 'days');
}

export function verifyDateRange(task: Task): boolean {
  // TODO?
  return false;
}

export function sortTasks(a: TaskDaoWithCalculatedFields, b: TaskDaoWithCalculatedFields): number {
  if (!!a.completedDate !== !!b.completedDate) {
    return a.completedDate ? 1 : -1;
  }
  return (b.priority || 0) - (a.priority || 0)
}

export function getLastPostponeUntilDate(task: TaskDao | TaskViewModel): Date | undefined {
  // task.postponeActions are in chronological order
  return last(
    task.actions?.filter((a) => isPostponeAction(a)) as PostponeAction[]
  )?.postponeUntilDate;
}

// TODO also use on backend (update type to `TaskDao | TaskViewModel`)
export function isPostponeDateValid(task: TaskViewModel, day: Date) {
  // Three conditions need to be met:
  // 1. Is the day after the current date?
  // 2. Is the day after the task startDate?
  // 3. If the task has been postponed before, is the day after the last postponeUntilDate?
  const taskEffectiveDay = dayjs(
    getLastPostponeUntilDate(task!) || task!.startDate
  ).startOf("day");
  const startOfTargetDay = dayjs(day).startOf("day");
  return (
    startOfTargetDay.isAfter(dayjs().startOf("day")) &&
    startOfTargetDay.isAfter(taskEffectiveDay)
  );
}
