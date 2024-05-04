import type { TaskDto } from './task.dto';
import dayjs, { Dayjs } from "@/lib/dayjs";
import { Action } from './task.dto';

/**
 * @TODO override required fields - fields that are expected to be calculated and populated 
 *   by retrieval-time
 */
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
  completedDate?: Dayjs;
  actions?: Action[];
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
  } as TaskViewModel;
}
