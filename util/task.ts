import type { TaskViewModel as Task } from "@/types/task.viewModel";
import type { TaskDao, TaskDaoWithCalculatedFields } from "@/types/task.dao";
import { type PostponeAction, isPostponeAction } from "@/types/task.dto";
import dayjs, { Dayjs } from "@/lib/dayjs";
import { last } from "lodash";

/**
 * Check `startDate`, `endDate`, and `rangeDays`. Two of the three should be provided, then the
 *    remaining one is calculated.
 * @param task
 */
// export function calculateDates(task: Task): Task {
//   const providedValues = [task.startDate, task.endDate, task.rangeDays].filter(
//     (v) => !!v
//   );
//   if (providedValues.length !== 2) {
//     throw new Error(
//       `Exactly two of the three date range values should be provided, got ${providedValues.length}`
//     );
//   }

//   const newTask: Task = { ...task };
//   if (newTask.startDate && newTask.endDate) {
//     newTask.rangeDays = calculateRangeDays(newTask.startDate, newTask.endDate);
//     return newTask;
//   }
//   if (newTask.startDate && newTask.rangeDays) {
//     newTask.endDate = calculateEndDate(newTask.startDate, newTask.rangeDays);
//     return newTask;
//   }
//   if (newTask.endDate && newTask.rangeDays) {
//     newTask.startDate = calculateStartDate(newTask.endDate, newTask.rangeDays);
//     return newTask;
//   }
//   throw new Error("Unexpected value"); // Shouldn't get here
// }

export function calculateRangeDays(startDate: Dayjs, endDate: Dayjs): number {
  // TODO these could be args eventually when times in the date range are supported.
  //   Figure out how to calculate when useStartTime === true or useEndTime === true
  const useStartTime: boolean = false;
  const useEndTime: boolean = false;
  // When `useStartTime === false`, assume the "start time" is the beginning of the day, just after midnight.
  // When `useEndTime === false`, assume the "end time" is the end of the day, just before midnight.
  const adjustedStartDate = useStartTime ? startDate : startDate.startOf("day");
  const adjustedEndDate = useEndTime
    ? endDate
    : endDate.endOf("day").add(2, "minutes"); // eh it works for now
  return adjustedEndDate.diff(adjustedStartDate, "days");
}

// export function calculateEndDate(startDate: Dayjs, rangeDays: number): Dayjs {
//   return startDate.add(rangeDays, "days");
// }

// export function calculateStartDate(endDate: Dayjs, rangeDays: number): Dayjs {
//   return endDate.subtract(rangeDays, "days");
// }

// TODO refactor usages to use other sort functions
export function sortTasks(
  a: TaskDaoWithCalculatedFields,
  b: TaskDaoWithCalculatedFields
): number {
  if (!!a.completedDate !== !!b.completedDate) {
    return a.completedDate ? 1 : -1;
  }
  return (b.priority || 0) - (a.priority || 0);
}

export function getLastPostponeUntilDate(
  task: TaskDao | Task
): Date | undefined {
  // task.postponeActions are in chronological order
  return last(
    task.actions?.filter((a) => isPostponeAction(a)) as PostponeAction[]
  )?.postponeUntilDate;
}

// TODO also use on backend (update type to `Task | TaskDao`)
export function isPostponeDateValid(task: Task, day: Date) {
  // Three conditions need to be met:
  // 1. Is the day after the current date?
  // 2. Is the day after the task startDate?
  // 3. If the task has been postponed before, is the day after the last postponeUntilDate?
  const taskEffectiveDay = dayjs(
    getLastPostponeUntilDate(task) || task.startDate
  ).startOf("day");
  const startOfTargetDay = dayjs(day).startOf("day");
  return (
    startOfTargetDay.isAfter(dayjs().startOf("day")) &&
    startOfTargetDay.isAfter(taskEffectiveDay)
  );
}

export function sortTasksByStartDate(taskA: Task, taskB: Task): number {
  return taskA.startDate.isBefore(taskB.startDate) ? -1 : 1;
}

export function sortTasksByEndDate(taskA: Task, taskB: Task): number {
  return taskA.endDate.isBefore(taskB.endDate) ? -1 : 1;
}

export function sortTasksByRange(taskA: Task, taskB: Task): number {
  return taskA.rangeDays < taskB.rangeDays ? -1 : 1;
}

export function sortTasksByTimeEstimate(taskA: Task, taskB: Task): number {
  return (taskA.timeEstimateMins || 0) < (taskB.timeEstimateMins || 0) ? -1 : 1;
}

export function sortTasksByRepeatInterval(taskA: Task, taskB: Task): number {
  return (taskA.repeatDays || 0) < (taskB.repeatDays || 0) ? -1 : 1;
}
