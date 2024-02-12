import type TaskDto from './task.dto';
import type { Dayjs } from 'dayjs';

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
  // TODO add `actions` here?
  priority?: number;
};
