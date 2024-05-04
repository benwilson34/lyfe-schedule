/**
 * Strictly frontend service
 *
 * For now I'm going to strip the offset to get the "canonical date". If/when we add time features, this
 *   will need to be revisited.
 *
 * @todo should wrap these functions with try-catch to log and display more user-friendly error message?
 */

import { CreateTaskDto, TaskDto, UpdateTaskDto } from "@/types/task.dto";
import { Dayjs } from "@/lib/dayjs";
import { getCanonicalDatestring } from "@/util/date";
import { getTimezoneOffsetHeader } from "@/util/timezoneOffset";

async function request<T extends Record<string, any> = {}>(
  method: string,
  endpoint: string,
  body?: Record<string, any>
): Promise<T> {
  const result = await fetch(endpoint, {
    method,
    headers: {
      // the auth header is added automatically?
      "Content-Type": "application/json",
      ...getTimezoneOffsetHeader(),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  const { data, detail } = (await result.json()) as { data: T; detail: string };
  if (result.status !== 200) {
    throw new Error(detail || `Request to ${method} ${endpoint} failed.`);
  }
  return data;
}

export async function decryptJwt() {
  return request<{ userId: string; isAdmin: boolean }>("GET", "/api/auth/jwt");
}

export async function getTasksForDay(day: Dayjs) {
  const { dayTasks } = await request<{ dayTasks: Record<string, TaskDto[]> }>(
    "GET",
    `/api/tasks?targetDay=${getCanonicalDatestring(day)}`
  );
  return dayTasks;
}

export async function getTasksForDayRange(startDay: Dayjs, endDay: Dayjs) {
  const { dayTasks } = await request<{ dayTasks: Record<string, TaskDto[]> }>(
    "GET",
    `/api/tasks?targetStartDay=${getCanonicalDatestring(
      startDay
    )}&targetEndDay=${getCanonicalDatestring(endDay)}`
  );
  return dayTasks;
}

export async function completeTask(
  completedTaskId: string,
  completedDate: Date
) {
  return request("PUT", `/api/tasks/${completedTaskId}`, {
    operation: "complete",
    completedDate: getCanonicalDatestring(completedDate),
  });
}

export async function postponeTask(taskId: string, postponeUntilDate: Dayjs) {
  return request("PUT", `/api/tasks/${taskId}`, {
    operation: "postpone",
    postponeUntilDate: getCanonicalDatestring(postponeUntilDate),
  });
}

// TODO or should the type be TaskViewModel then we'll just convert to TaskDto?
export async function createTask(task: CreateTaskDto) {
  const { taskId } = await request<{ taskId: string }>(
    "POST",
    "/api/tasks",
    // TODO should use `getCanonicalDatestring` on the `task` fields here?
    task
  );
  return taskId;
}

export async function updateTask(taskId: string, task: UpdateTaskDto) {
  const { taskId: modifiedId } = await request<{ taskId: string }>(
    "PATCH",
    `/api/tasks/${taskId}`,
    task
  );
  return modifiedId;
}

export async function deleteTask(taskId: string) {
  return request("DELETE", `/api/tasks/${taskId}`);
}
