/**
 * Strictly frontend service
 *
 * For now I'm going to strip the offset to get the "canonical date". If/when we add time features, this
 *   will need to be revisited.
 *
 * @todo should wrap these functions with try-catch to log and display more user-friendly error message?
 */

import {
  CreateTaskDto,
  PatchTaskDto,
  PostponeAction,
  TaskDto,
} from "@/types/task.dto";
import dayjs, { Dayjs } from "@/lib/dayjs";
import { getCanonicalDatestring } from "@/util/date";
import { getTimezoneOffsetHeader } from "@/util/timezoneOffset";
import { findIndex } from "lodash";
import { Entries } from "@/util/types";

const DEMO_USER_ID = "_";
// will serve as a "data store"
let demoTasks: TaskDto[] = [
  {
    id: "0",
    userId: DEMO_USER_ID,
    title: "demo task 1",
    startDate: "2024-11-13",
    endDate: "2024-11-18",
    rangeDays: 6,
    tags: ["chores", "tag1"],
  },
  {
    id: "1",
    userId: DEMO_USER_ID,
    title: "demo task 2",
    startDate: "2024-11-10",
    endDate: "2024-11-13",
    rangeDays: 4,
    tags: ["chores"],
  },
];
let taskIdCounter: number = demoTasks.length;
console.warn("LOADING FROM DEMO API!!"); // TODO remove

function findTask(id: string): TaskDto {
  const foundTask = demoTasks.find(({ id: taskId }) => taskId === id);
  if (!foundTask) {
    throw new Error(`Couldn't find task with id "${id}"`);
  }
  return foundTask;
}

function findTaskIndex(id: string): number {
  const foundTaskIndex = findIndex(
    demoTasks,
    ({ id: taskId }) => taskId === id
  );
  if (!foundTaskIndex) {
    throw new Error(`Couldn't find task with id "${id}"`);
  }
  return foundTaskIndex;
}

export async function decryptJwt() {
  throw new Error("not implemented");
}

export async function getTasks({
  tag = "",
}: {
  tag: string;
}): Promise<TaskDto[]> {
  console.log("GETTING DEMO TASKS!!!!");
  if (tag) {
    return [...demoTasks].filter(({ tags: taskTags }) =>
      taskTags?.includes(tag)
    );
  }
  return [...demoTasks];
}

export async function getTasksForDay(
  day: Dayjs
): Promise<Record<string, TaskDto[]>> {
  throw new Error("not implemented yet");

  // const { dayTasks } = await request<{ dayTasks: Record<string, TaskDto[]> }>({
  //   method: "GET",
  //   endpoint: "/api/tasks",
  //   params: new URLSearchParams({ targetDay: getCanonicalDatestring(day) }),
  // });
  // return dayTasks;
}

export async function getTasksForDayRange(
  startDay: Dayjs,
  endDay: Dayjs
): Promise<Record<string, TaskDto[]>> {
  throw new Error("not implemented yet");

  // const { dayTasks } = await request<{ dayTasks: Record<string, TaskDto[]> }>({
  //   method: "GET",
  //   endpoint: "/api/tasks",
  //   params: new URLSearchParams({
  //     targetStartDay: getCanonicalDatestring(startDay),
  //     targetEndDay: getCanonicalDatestring(endDay),
  //   }),
  // });
  // return dayTasks;
}

export async function completeTask(
  completedTaskId: string,
  completedDate: Date
): Promise<string | undefined> {
  const foundTask = findTask(completedTaskId);

  let newStartDate: Dayjs | undefined = undefined;
  if (foundTask.repeatDays) {
    newStartDate = dayjs(completedDate)
      .startOf("day")
      .add(foundTask.repeatDays, "days");
    demoTasks.push({
      ...foundTask,
      startDate: newStartDate.toString(),
      endDate: newStartDate.add(foundTask.rangeDays - 1, "days").toString(), // minus one because range is [start of startDate, end of endDate]
    });
  }
  foundTask.completedDate = completedDate.toString();
  // if a new (repeating) task was created, return its startDate
  return newStartDate?.toString();
}

export async function postponeTask(
  taskId: string,
  postponeUntilDate: Dayjs
): Promise<undefined> {
  const foundTask = findTask(taskId);
  const postponeAction = {
    timestamp: dayjs().toString(),
    postponeUntilDate: getCanonicalDatestring(postponeUntilDate),
  } as unknown as PostponeAction; // hmmm I think I need to change the `Action` types to be string instead of Date?

  if (foundTask.actions) {
    foundTask.actions.push(postponeAction);
  } else {
    foundTask.actions = [postponeAction];
  }
}

// TODO or should the type be TaskViewModel then we'll just convert to TaskDto?
export async function createTask(task: CreateTaskDto): Promise<string> {
  const id = taskIdCounter.toString();
  demoTasks.push({
    id,
    userId: DEMO_USER_ID,
    title: task.title,
    startDate: task.startDate.toString(),
    endDate: task.endDate.toString(),
    rangeDays: task.rangeDays,
  });
  taskIdCounter += 1;
  return id;
}

export async function patchTask(
  taskId: string,
  task: PatchTaskDto
): Promise<string> {
  const foundTask = findTask(taskId);
  for (const [field, patch] of Object.entries(task) as Entries<typeof task>) {
    if (patch!.op === "remove") {
      delete foundTask[field];
    } else {
      // operation is "update"
      // this workaround smells but idk TypeScript well enough (yet) to fix it in a better way
      foundTask[field] = patch!.value as never;
    }
  }
  return taskId;
}

export async function deleteTask(taskId: string): Promise<void> {
  const foundTaskIndex = findTaskIndex(taskId);
  demoTasks.splice(foundTaskIndex, 1);
}

export async function deleteAllTasks(): Promise<void> {
  demoTasks = [];
}

export async function getTagCounts(): Promise<Record<string, number>> {
  const tagCounts: Record<string, number> = {};
  for (const { tags } of demoTasks) {
    if (!tags) {
      continue;
    }
    for (const tag of tags) {
      if (tagCounts[tag]) {
        tagCounts[tag] += 1;
      } else {
        tagCounts[tag] = 1;
      }
    }
  }
  return tagCounts;
}

export async function registerUserFromInvitation(
  token: string,
  password: string
): Promise<void> {
  throw new Error("not implemented");
}

export async function registerUser(
  email: string,
  password: string
): Promise<void> {
  throw new Error("not implemented");
}

export async function requestResetPassword(email: string): Promise<void> {
  throw new Error("not implemented");
}

export async function setNewPassword(
  token: string,
  password: string
): Promise<void> {
  throw new Error("not implemented");
}

export async function sendInvitation(inviteeEmail: string): Promise<void> {
  throw new Error("not implemented");
}
