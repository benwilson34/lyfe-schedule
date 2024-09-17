import { ObjectId, OptionalId, WithoutId, WithId } from "mongodb";
import {
  CreateTaskDto,
  UpdateTaskDto,
  isPostponeAction,
  type TaskDto,
} from "./task.dto";
import dayjs from "@/lib/dayjs";
import { Modify } from "@/util/types";
import { getCanonicalDatestring } from "@/util/date";

export type TaskDaoWithCalculatedFields = WithId<
  Modify<
    Omit<TaskDto, "id">,
    {
      userId: ObjectId;
      startDate: Date;
      endDate: Date;
      completedDate?: Date;
    }
  >
>;

/**
 * Access object for the Todo task model.
 */
export type TaskDao = Omit<
  TaskDaoWithCalculatedFields,
  "isProjected" | "priority"
>;

export type CreateTaskDao = WithoutId<TaskDao>;

export type UpdateTaskDao = WithoutId<
  Partial<Omit<TaskDao, "userId" | "actions">>
>;

export function convertTaskDaoToDto(
  taskDao: TaskDaoWithCalculatedFields
): TaskDto {
  const {
    _id,
    userId,
    title,
    timeEstimateMins,
    startDate,
    rangeDays,
    endDate,
    repeatDays,
    isProjected,
    tags,
    completedDate,
    actions,
  } = taskDao;
  return {
    ...(_id && { id: _id.toString() }),
    userId: userId.toString(),
    title,
    ...(timeEstimateMins && { timeEstimateMins }),
    startDate: getCanonicalDatestring(startDate, false),
    rangeDays,
    endDate: getCanonicalDatestring(endDate, false),
    ...(repeatDays && { repeatDays }),
    ...(isProjected && { isProjected }),
    ...(tags && { tags }),
    ...(completedDate && {
      completedDate: getCanonicalDatestring(completedDate, false),
    }),
    ...(actions && {
      actions: actions.map((action) => ({
        timestamp: getCanonicalDatestring(action.timestamp, false),
        ...(isPostponeAction(action) && {
          postponeUntilDate: getCanonicalDatestring(action.postponeUntilDate, false),
        }),
      })),
    }),
  } as TaskDto;
}

export function convertCreateTaskDtoToDao(
  createTaskDto: CreateTaskDto
): TaskDao {
  const {
    title,
    timeEstimateMins,
    startDate,
    rangeDays,
    endDate,
    repeatDays,
    tags,
    completedDate,
    actions,
  } = createTaskDto;
  return {
    title,
    ...(timeEstimateMins && { timeEstimateMins }),
    startDate: dayjs.utc(startDate).toDate(),
    rangeDays,
    endDate: dayjs.utc(endDate).toDate(),
    ...(repeatDays && { repeatDays }),
    ...(tags && { tags }),
    ...(completedDate && { completedDate: dayjs.utc(completedDate).toDate() }),
    ...(actions && {
      actions: actions.map((action) => ({
        timestamp: dayjs.utc(action.timestamp).toDate(),
        ...(isPostponeAction(action) && {
          postponeUntilDate: dayjs.utc(action.postponeUntilDate).toDate(),
        }),
      })),
    }),
  } as TaskDao;
}

export function convertUpdateTaskDtoToDao(
  updateTaskDto: UpdateTaskDto
): UpdateTaskDao {
  const {
    title,
    timeEstimateMins,
    startDate,
    rangeDays,
    endDate,
    repeatDays,
    tags,
    completedDate,
  } = updateTaskDto;
  return {
    ...(title && { title }),
    ...(timeEstimateMins && { timeEstimateMins }), // TODO this could also be a "remove" operation. This dao is less like the others...
    ...(startDate && { startDate: dayjs.utc(startDate).toDate() }),
    ...(rangeDays && { rangeDays }),
    ...(endDate && { endDate: dayjs.utc(endDate).toDate() }),
    ...(repeatDays && { repeatDays }), // TODO this could also be a "remove" operation...
    ...(tags && { tags }),
    ...(completedDate && { completedDate }),
  } as UpdateTaskDao;
}
