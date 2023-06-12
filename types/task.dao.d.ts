import type { ObjectId, OptionalId } from 'mongodb';
import type TaskDto from './task.dto';

/**
 * Access object for the Todo task model.
 * @todo is this explicit definition needed, or is there some shorthand way from the
 *   Node MongoDB package?
 * @todo convert `startDate` type to `Date` here if the DTO changes it to `string`
 */
export type TaskDao = OptionalId<Omit<TaskDto, 'id'>>;

export type TaskInsertDao = WithoutId<TaskDao>;

export type TaskUpdateDao = WithoutId<Partial<TaskDao>>;
