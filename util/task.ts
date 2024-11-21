// import type { TaskViewModel as Task } from "@/types/task.viewModel";
import { isPostponeAction } from "@/types/task.dto";
import dayjs, { Dayjs, isDayjs } from "@/lib/dayjs";
import { assign, last } from "lodash";
import { asEndDate } from "./date";
import { lerp } from "./math";
import { formatDayKey } from "./format";

type DateField = Date | string | Dayjs;

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
export function sortTasks<
  BaseTask extends {
    completedDate?: DateField;
    priority?: number;
  },
>(a: BaseTask, b: BaseTask): number {
  if (!!a.completedDate !== !!b.completedDate) {
    return a.completedDate ? 1 : -1;
  }
  return (b.priority || 0) - (a.priority || 0);
}

export function calculatePriority(
  startDate: DateField,
  endDate: DateField,
  currentDay: Dayjs | Date
): number {
  // TODO validate that args are reasonable, e.g. that startDate is after endDate, etc?
  const MIN_PRIORITY = 0;
  const MAX_PRIORITY = 1;
  // TODO handle different start time (assumed to be start of day)
  const conformedStartDate = (
    isDayjs(startDate) ? startDate : dayjs(startDate)
  ).startOf("day");
  // TODO handle different end time (assumed to be end of day)
  const conformedEndDate = asEndDate(
    isDayjs(endDate) ? endDate : dayjs(endDate)
  );
  const conformedCurrentDay = isDayjs(currentDay)
    ? currentDay
    : dayjs(currentDay);
  const rangeHours = conformedEndDate.diff(conformedStartDate, "hours");
  const elapsedHours = conformedCurrentDay.diff(conformedStartDate, "hours");
  return lerp(MIN_PRIORITY, MAX_PRIORITY, elapsedHours / rangeHours);
}

// given list of incomplete tasks (from target day and before) and target day to project onto
// for each task in list:
//   - first determine "theoretical complete date" - today for active/overdue tasks, or the startDate otherwise
//   - based on the "TCD" above, count days to determine projection. Assume repeat from complete date
function getProjectedRepeatingTasksForDay<
  BaseTask extends {
    startDate: Dayjs;
    endDate: Dayjs;
    repeatDays?: number;
    actions?: BaseAction[];
  },
  BaseAction extends {
    postponeUntilDate?: Dayjs;
  },
>(
  incompleteTasks: BaseTask[],
  targetDay: Dayjs,
  currentDay: Dayjs
): BaseTask[] {
  const startOfTargetDay = targetDay.startOf("day");
  const startOfCurrentDay = currentDay.startOf("day");
  return incompleteTasks
    .filter((task) => {
      // task.repeatDays must be >= 1 if defined
      if (!task.repeatDays) {
        return false;
      }
      const startOfStartDate = task.startDate.startOf("day");
      const startOfLastPostponeUntilDay = getLastPostponeUntilDay(
        task.actions
      )?.startOf("day");
      // theoretical complete date has nothing to do with targetDay!
      const theoreticalCompleteDay =
        startOfLastPostponeUntilDay ||
        (startOfStartDate.isAfter(startOfCurrentDay, "day")
          ? startOfStartDate
          : startOfCurrentDay);
      // If the task's TCD is the same as the targetDay, the task is still open, so it doesn't need
      //   to be projected.
      const targetIsSameDay = theoreticalCompleteDay.isSame(
        startOfTargetDay,
        "day"
      );
      // Assume for now that repeating tasks are being completed the first day they're open.
      //   Although it might be better to have some configurable "projection threshold value"
      //   that scales on [0,1] for [startDate,endDate].
      //   That could also be automatically tailored to the user by collecting an average over their
      //   previously completed tasks of when in the date range it was completed.
      const doesTaskRepeatOnTargetDay =
        theoreticalCompleteDay.diff(startOfTargetDay, "day") %
          task.repeatDays ===
        0;
      return !targetIsSameDay && doesTaskRepeatOnTargetDay;
    })
    .map((task) => {
      const startOfStartDate = task.startDate.startOf("day");
      const offsetDays = startOfTargetDay.diff(startOfStartDate, "day");
      return {
        ...task,
        startDate: startOfStartDate.add(offsetDays, "day").toDate(),
        endDate: task.endDate.startOf("day").add(offsetDays, "day").toDate(),
        isProjected: true,
      };
    });
}

// filter taskList? Or assume it's filtered?
export function getTasksForDay<
  BaseTask extends {
    startDate: Dayjs;
    endDate: Dayjs;
    completedDate?: Dayjs;
    actions?: BaseAction[];
  },
  BaseAction extends {
    postponeUntilDate?: Dayjs;
  },
>(
  taskList: BaseTask[],
  targetDay: Dayjs,
  currentDay: Dayjs,
  { filterOutPostponed = true }: { filterOutPostponed?: boolean } = {}
): BaseTask[] {
  const startOfTargetDay = targetDay.startOf("day");
  const targetDayIsAfterCurrentDay = startOfTargetDay.isAfter(currentDay);
  const endOfTargetDay = startOfTargetDay.add(1, "day");

  type CalculatedBaseTask = BaseTask & { lastPostponeUntilDay?: Dayjs };
  let tasks: CalculatedBaseTask[] = taskList
    // TODO could optimize by making this filter optional?
    .filter((task) => {
      // if targetDay > currentDay, remove completed tasks (would there be any anyway?)
      if (targetDayIsAfterCurrentDay && task.completedDate) {
        return false;
      }
      if (task.completedDate) {
        const completedDay = task.completedDate;
        return completedDay.isSame(startOfTargetDay, "day");
      }
      return task.startDate.isBefore(endOfTargetDay);
    })
    .map(
      (task) =>
        assign(task, {
          lastPostponeUntilDate: getLastPostponeUntilDay(task.actions),
          // TODO don't calculate priority here
          priority: calculatePriority(task.startDate, task.endDate, currentDay),
        })
      // TODO support other sort methods - or shouldn't we sort on the server side?
    )
    .sort(sortTasksByStartDate);

  if (filterOutPostponed) {
    tasks = tasks.filter((task) => {
      if (!task.lastPostponeUntilDay) return true;
      const lastPostponeUntilDate = task.lastPostponeUntilDay;
      return (
        startOfTargetDay.isSame(lastPostponeUntilDate, "day") ||
        startOfTargetDay.isAfter(lastPostponeUntilDate)
      );
    });
  }
  if (targetDayIsAfterCurrentDay) {
    const tasksPostponedToTargetDay = tasks.filter((task) =>
      startOfTargetDay.isSame(task.lastPostponeUntilDay, "day")
    );
    const tasksThatStartOnTargetDay = tasks.filter((task) =>
      startOfTargetDay.isSame(task.startDate, "day")
    );
    tasks = [
      ...tasksPostponedToTargetDay,
      ...tasksThatStartOnTargetDay,
      ...getProjectedRepeatingTasksForDay(tasks, targetDay, currentDay),
    ];
  }
  return tasks;
}

// `taskList` can be pre-filtered on [startDate, endDate] as needed
export function getTasksForDayRange<
  BaseTask extends {
    startDate: Dayjs;
    endDate: Dayjs;
    actions?: BaseAction[];
  },
  BaseAction extends {
    postponeUntilDate?: Dayjs;
  },
>(
  taskList: BaseTask[],
  targetStartDay: Dayjs,
  targetEndDay: Dayjs,
  currentDay: Dayjs
): Record<string, BaseTask[]> {
  const dayDiff = targetEndDay.diff(targetStartDay, "day") + 1; // inclusive bounds, so we'll add one
  const dayToTasksMap: Record<string, BaseTask[]> = {};
  let dayOffset = 0;
  while (dayOffset !== dayDiff) {
    const targetDay = targetStartDay.add(dayOffset, "day");
    const targetDayKey = formatDayKey(targetDay);
    dayToTasksMap[targetDayKey] = getTasksForDay(
      taskList,
      targetDay,
      currentDay
    );
    dayOffset += 1;
  }
  return dayToTasksMap;
}

export function getLastPostponeUntilDay<
  BaseAction extends {
    postponeUntilDate?: Dayjs;
  },
>(actions?: BaseAction[]): Dayjs | undefined {
  // assume actions are in chronological order
  return last(actions?.filter((a) => isPostponeAction(a)))?.postponeUntilDate;
}

// TODO also use on backend - gotta be careful about UTC though
export function isPostponeDateValid<
  BaseTask extends { startDate: Dayjs; actions?: BaseAction[] },
  BaseAction extends { postponeUntilDate?: Dayjs },
>(task: BaseTask, targetDay: Dayjs, currentDay: Dayjs) {
  // Three conditions need to be met:
  // 1. Is the day after the current date?
  // 2. Is the day after the task startDate?
  // 3. If the task has been postponed before, is the day after the last postponeUntilDate?
  const taskEffectiveDay = (
    getLastPostponeUntilDay(task.actions) || task.startDate
  ).startOf("day");
  const startOfTargetDay = targetDay.startOf("day");
  return (
    startOfTargetDay.isAfter(currentDay.startOf("day")) &&
    startOfTargetDay.isAfter(taskEffectiveDay)
  );
}

export function sortTasksByStartDate<BaseTask extends { startDate: Dayjs }>(
  taskA: BaseTask,
  taskB: BaseTask
): number {
  return taskA.startDate.isBefore(taskB.startDate) ? -1 : 1;
}

export function sortTasksByEndDate<BaseTask extends { endDate: Dayjs }>(
  taskA: BaseTask,
  taskB: BaseTask
): number {
  return taskA.endDate.isBefore(taskB.endDate) ? -1 : 1;
}

export function sortTasksByRange<BaseTask extends { rangeDays: number }>(
  taskA: BaseTask,
  taskB: BaseTask
): number {
  return taskA.rangeDays < taskB.rangeDays ? -1 : 1;
}

export function sortTasksByTimeEstimate<
  BaseTask extends { timeEstimateMins?: number },
>(taskA: BaseTask, taskB: BaseTask): number {
  return (taskA.timeEstimateMins || 0) < (taskB.timeEstimateMins || 0) ? -1 : 1;
}

export function sortTasksByRepeatInterval<
  BaseTask extends { repeatDays?: number },
>(taskA: BaseTask, taskB: BaseTask): number {
  return (taskA.repeatDays || 0) < (taskB.repeatDays || 0) ? -1 : 1;
}
