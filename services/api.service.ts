// Strictly frontend service

import { TaskDto } from "@/types/task.dto";
import { Dayjs } from "dayjs";

export async function getTasksForDay(day: Dayjs) {
  const result = await fetch(`/api/tasks?targetDay=${day.toISOString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (result.status !== 200) {
    throw new Error("Failed to fetch tasks");
  }
  const { data } = (await result.json()) as {
    data: { dayTasks: Record<string, TaskDto[]> };
  };
  return data.dayTasks;
}

export async function getTasksForDayRange(startDay: Dayjs, endDay: Dayjs) {
  const result = await fetch(
    `/api/tasks?targetStartDay=${startDay.toISOString()}&targetEndDay=${endDay.toISOString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (result.status !== 200) {
    throw new Error("Failed to fetch tasks for multiple days");
  }
  const { data } = (await result.json()) as {
    data: { dayTasks: Record<string, TaskDto[]> };
  };
  return data.dayTasks;
}

export async function completeTask(
  completedTaskId: string,
  completedDate?: Date
) {
  const result = await fetch(`/api/tasks/${completedTaskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operation: "complete",
      ...(completedDate && { completedDate: completedDate.toISOString() }),
    }),
  });

  const body = await result.json();
  if (result.status !== 200) {
    throw new Error("Failed to complete task");

  }
}

export async function postponeTask(taskId: string, postponeUntilDate: Dayjs) {
  const requestBody = {
    operation: "postpone",
    postponeUntilDate: postponeUntilDate.toISOString(),
  };
  const result = await fetch(`/api/tasks/${taskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
  const responseBody = await result.json();
  if (result.status !== 200) {
    throw new Error(`>> error: ${JSON.stringify(responseBody)}`);
  }
}

export async function deleteTask(taskId: string) {
  const result = await fetch(`/api/tasks/${taskId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const body = await result.json();
  if (result.status !== 200) {
    throw new Error(`>> error: ${JSON.stringify(body)}`);
  }
}
