import type { TaskDto } from "./task.dto";
import dayjs, { Dayjs } from "@/lib/dayjs";
import { ActionDto } from "./task.dto";

/**
 * @TODO override required fields - fields that are expected to be calculated and populated
 *   by retrieval-time
 */
export type ActionViewModel = {
  timestamp: Dayjs;
  postponeUntilDate?: Dayjs;
};

export type TaskViewModel = {
  id: string;
  userId: string;
  title: string;
  timeEstimateMins?: number;
  startDate: Dayjs;
  rangeDays: number;
  endDate: Dayjs;
  repeatDays?: number;
  isProjected?: boolean;
  tags?: string[];
  completedDate?: Dayjs;
  actions?: ActionViewModel[];
  priority?: number;
};

export function taskDtoToViewModel(taskDto: TaskDto): TaskViewModel {
  return {
    ...taskDto,
    startDate: dayjs(taskDto.startDate),
    endDate: dayjs(taskDto.endDate),
    ...(taskDto.completedDate && {
      completedDate: dayjs(taskDto.completedDate),
    }),
    ...(taskDto.actions &&
      taskDto.actions.map((action) => ({
        timestamp: dayjs(action.timestamp),
        ...((action as any).postponeUntilDate && {
          // TODO fix typing
          postponeUntilDate: dayjs((action as any).postponeUntilDate),
        }),
      }))),
  } as TaskViewModel;
}
