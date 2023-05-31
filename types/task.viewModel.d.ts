import type TaskDto from './task.dto';
import type { Dayjs } from 'dayjs';

/**
 * @TODO override required fields - fields that are expected to be calculated and populated 
 *   by retrieval-time
 */
export type TaskViewModel = TaskViewModel & {
  id: number,
  title: string,
  startDate: Dayjs,
  endDate: Dayjs,
  rangeDays: number,
};
