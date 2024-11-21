/**
 * Strictly frontend service
 *
 * For now I'm going to strip the offset to get the "canonical date". If/when we add time features, this
 *   will need to be revisited.
 *
 * @todo should wrap these functions with try-catch to log and display more user-friendly error message?
 */

import { CreateTaskDto, PatchTaskDto, TaskDto } from "@/types/task.dto";
import { Dayjs } from "@/lib/dayjs";
import { getCanonicalDatestring } from "@/util/date";
import { getTimezoneOffsetHeader } from "@/util/timezoneOffset";

async function request<T extends Record<string, any> | undefined = undefined>({
  method,
  endpoint,
  body,
  params,
  okResponseCodes = [200],
}: {
  method: string;
  endpoint: string;
  body?: Record<string, any>;
  params?: URLSearchParams;
  okResponseCodes?: number[];
}): Promise<T> {
  const fullEndpoint = `${endpoint}${params ? `?${params.toString()}` : ""}`;
  const result = await fetch(fullEndpoint, {
    method,
    headers: {
      // the auth header is added automatically?
      "Content-Type": "application/json",
      ...getTimezoneOffsetHeader(),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  const { data, detail } = (await result.json()) as {
    data: T;
    detail: string;
  };
  // not sure I like handling the error here but it works for now
  if (!okResponseCodes.includes(result.status)) {
    throw new Error(detail || `Request to ${method} ${endpoint} failed.`);
  }
  return data;
}

export async function decryptJwt() {
  return request<{ userId: string; isAdmin: boolean }>({
    method: "GET",
    endpoint: "/api/auth/jwt",
  });
}

export async function getTasks({
  tag = "",
}: {
  tag?: string;
} = {}): Promise<TaskDto[]> {
  const params = new URLSearchParams();
  if (tag.length > 0) {
    params.append("tag", tag);
  }
  const { tasks } = await request<{ tasks: TaskDto[] }>({
    method: "GET",
    endpoint: "/api/tasks",
    params,
  });
  return tasks;
}

export async function getTasksForDay(
  day: Dayjs
): Promise<Record<string, TaskDto[]>> {
  const { dayTasks } = await request<{ dayTasks: Record<string, TaskDto[]> }>({
    method: "GET",
    endpoint: "/api/tasks",
    params: new URLSearchParams({ targetDay: getCanonicalDatestring(day) }),
  });
  return dayTasks;
}

export async function getTasksForDayRange(
  startDay: Dayjs,
  endDay: Dayjs
): Promise<Record<string, TaskDto[]>> {
  const { dayTasks } = await request<{ dayTasks: Record<string, TaskDto[]> }>({
    method: "GET",
    endpoint: "/api/tasks",
    params: new URLSearchParams({
      targetStartDay: getCanonicalDatestring(startDay),
      targetEndDay: getCanonicalDatestring(endDay),
    }),
  });
  return dayTasks;
}

export async function completeTask(
  completedTaskId: string,
  completedDate: Date
): Promise<string | undefined> {
  // there's only data in the response if the task was repeating and a new task was created
  const data = await request<
    | {
        createdRepeatingTask: { id: string; startDate: string };
      }
    | undefined
  >({
    method: "PUT",
    endpoint: `/api/tasks/${completedTaskId}`,
    body: {
      operation: "complete",
      completedDate: getCanonicalDatestring(completedDate),
    },
  });
  if (data) {
    return data.createdRepeatingTask.startDate;
  }
}

export async function postponeTask(
  taskId: string,
  postponeUntilDate: Dayjs
): Promise<undefined> {
  return request({
    method: "PUT",
    endpoint: `/api/tasks/${taskId}`,
    body: {
      operation: "postpone",
      postponeUntilDate: getCanonicalDatestring(postponeUntilDate),
    },
  });
}

// TODO or should the type be TaskViewModel then we'll just convert to TaskDto?
export async function createTask(task: CreateTaskDto): Promise<string> {
  const { taskId } = await request<{ taskId: string }>({
    method: "POST",
    endpoint: "/api/tasks",
    // TODO should use `getCanonicalDatestring` on the `task` fields here?
    body: task,
  });
  return taskId;
}

export async function patchTask(
  taskId: string,
  task: PatchTaskDto
): Promise<string> {
  const { taskId: modifiedId } = await request<{ taskId: string }>({
    method: "PATCH",
    endpoint: `/api/tasks/${taskId}`,
    // TODO should use `getCanonicalDatestring` on the `task` fields here?
    body: task,
  });
  return modifiedId;
}

export async function deleteTask(taskId: string): Promise<void> {
  await request({ method: "DELETE", endpoint: `/api/tasks/${taskId}` });
}

export async function deleteAllTasks(): Promise<void> {
  await request({ method: "DELETE", endpoint: `/api/tasks` });
}

export async function getTagCounts(): Promise<Record<string, number>> {
  const { tagCounts } = await request<{ tagCounts: Record<string, number> }>({
    method: "GET",
    endpoint: "/api/tags",
  });
  return tagCounts;
}

export async function registerUserFromInvitation(
  token: string,
  password: string
): Promise<void> {
  await request({
    method: "PUT",
    endpoint: "/api/users",
    body: {
      operation: "register-from-invitation",
      token,
      password,
    },
  });
}

export async function registerUser(
  email: string,
  password: string
): Promise<void> {
  await request({
    method: "POST",
    endpoint: "/api/users",
    body: { email, password },
  });
}

export async function requestResetPassword(email: string): Promise<void> {
  await request({
    method: "PUT",
    endpoint: "/api/users",
    body: {
      operation: "request-reset-password",
      email,
    },
    // we don't want to give away whether the email was found or not, thus 401 response is ok
    okResponseCodes: [200, 401],
  });
}

export async function setNewPassword(
  token: string,
  password: string
): Promise<void> {
  await request({
    method: "PUT",
    endpoint: "/api/users",
    body: {
      operation: "set-new-password",
      token,
      password,
    },
  });
}

export async function sendInvitation(inviteeEmail: string): Promise<void> {
  await request({
    method: "PUT",
    endpoint: "/api/users",
    body: {
      operation: "send-invitation",
      inviteeEmail,
    },
  });
}
