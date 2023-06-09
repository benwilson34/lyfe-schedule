import type { TaskViewModel as Task } from "@/types/task.viewModel";
import { Dayjs } from "dayjs";

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

export function calculateRangeDays(startDate: Dayjs, endDate: Dayjs): number {
  return endDate.diff(startDate, 'days');
}

export function calculateEndDate(startDate: Dayjs, rangeDays: number): Dayjs {
  return startDate.add(rangeDays, 'days');
}

export function calculateStartDate(endDate: Dayjs, rangeDays: number): Dayjs {
  return endDate.subtract(rangeDays, 'days');
}

export function verififyDateRange(task: Task): boolean {
  // TODO?
  return false;
}
