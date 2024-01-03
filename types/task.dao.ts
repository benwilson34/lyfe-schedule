import type { ObjectId, OptionalId, WithoutId } from 'mongodb';
import type { TaskDto } from './task.dto';
import dayjs from 'dayjs';


// TODO move to helper module
type Modify<T, R> = Omit<T, keyof R> & R;

/**
 * Access object for the Todo task model.
 * @todo is this explicit definition needed, or is there some shorthand way from the
 *   Node MongoDB package?
 * @todo convert `startDate` type to `Date` here if the DTO changes it to `string`
 */

export type TaskDao = OptionalId<Modify<TaskDto, {
  startDate: Date,
  endDate: Date,
  completedDate?: Date,
}>>;

export type TaskInsertDao = WithoutId<TaskDao>;

export type TaskUpdateDao = WithoutId<Partial<TaskDao>>;

export function taskDaoToDto(taskDao: TaskDao): TaskDto {
  const { _id, title, timeEstimateMins, startDate, rangeDays, endDate, repeatDays, isProjected, completedDate } = taskDao;
  return {
    ...(_id && { id: _id.toString() }),
    title,
    ...(timeEstimateMins && { timeEstimateMins }),
    startDate: startDate.toISOString(),
    rangeDays,
    endDate: endDate.toISOString(),
    ...(repeatDays && { repeatDays }),
    ...(isProjected && { isProjected }),
    ...(completedDate && { completedDate: completedDate.toISOString() }),
  } as TaskDto;
}

export function taskDtoToDao(taskDto: TaskDto): TaskDao {
  const { id, title, timeEstimateMins, startDate, rangeDays, endDate, repeatDays, completedDate } = taskDto;
  return {
    ...(id && { _id: id }),
    title,
    ...(timeEstimateMins && { timeEstimateMins }),
    startDate: dayjs(startDate).toDate(),
    rangeDays,
    endDate: dayjs(endDate).toDate(),
    ...(repeatDays && { repeatDays }),
    ...(completedDate && { completedDate: dayjs(completedDate).toDate() }),
  } as TaskDao;
}
