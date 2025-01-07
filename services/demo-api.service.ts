/**
 * Strictly frontend service
 *
 * This module serves as a "demo API" that uses localStorage instead of the remote API/data store.
 */

import {
  isPostponeAction,
  type ActionDto,
  type CreateTaskDto,
  type PatchTaskDto,
  type PostponeActionDto,
  type TaskDto,
} from "@/types/task.dto";
import dayjs, { Dayjs } from "@/lib/dayjs";
import { getCanonicalDatestring } from "@/util/date";
import { findIndex } from "lodash";
import { Entries, Modify } from "@/util/types";
import { formatDayKey } from "@/util/format";
import {
  getTasksForDay as calculateTasksForDay,
  getTasksForDayRange as calculateTasksForDayRange,
} from "@/util/task";

const DEMO_USER_ID = "_";
const TASK_KEY = "tasks";
const TASK_ID_COUNTER_KEY = "taskIdCounter";
// will serve as a "data store"
// TODO should do ViewModel[]? So I don't have to parse the Dates over and over
//   Maybe change the `api.service` functions that return `TaskDto` to `TaskViewModel`
//   since that's what the consumer is going to use anyway.
let demoTasks: TaskDto[];
let demoTaskIdCounter: number;
let isLoaded = false;

function loadData(): TaskDto[] | null {
  if (!global.window) {
    console.warn("global.window is not defined");
    return null;
  }
  console.log("Loading demo data");
  const loadedTasksString = global.window.localStorage.getItem(TASK_KEY);
  const today = dayjs();
  const initTasks: TaskDto[] = [
    {
      title: "Try out LyfeSchedule",
      startDate: today,
      rangeDays: 1,
      timeEstimateMins: 10,
    },
    {
      title: "Sweep the floor",
      startDate: today.subtract(8, "day"),
      rangeDays: 7,
      repeatDays: 7,
      tags: ["chores"],
    },
    {
      title: "Drop off package at the post office",
      startDate: today.subtract(1, "day"),
      rangeDays: 4,
      timeEstimateMins: 30,
      tags: ["work", "chores"],
    },
    {
      title: "Work out",
      startDate: today.subtract(1, "day"),
      rangeDays: 2,
      repeatDays: 1,
      timeEstimateMins: 60,
      tags: ["personal-goals"],
    },
    {
      title: "Wash water bottle",
      startDate: today.subtract(1, "day"),
      rangeDays: 5,
      repeatDays: 3,
      timeEstimateMins: 5,
      tags: ["chores"],
    },
    {
      title: "Respond to emails",
      startDate: today,
      rangeDays: 1,
      repeatDays: 1,
      timeEstimateMins: 10,
      completedDate: formatDayKey(today),
      tags: ["work"],
    },
  ].map((task, index) => ({
    ...task,
    userId: DEMO_USER_ID,
    id: index.toString(),
    startDate: formatDayKey(task.startDate),
    endDate: formatDayKey(dayjs(task.startDate).add(task.rangeDays - 1, "day")),
  }));
  demoTasks = loadedTasksString ? JSON.parse(loadedTasksString) : initTasks;
  const loadedTaskIdCounterString =
    global.window.localStorage.getItem(TASK_ID_COUNTER_KEY);
  demoTaskIdCounter = loadedTaskIdCounterString
    ? JSON.parse(loadedTaskIdCounterString)
    : initTasks.length;
  return demoTasks;
}

function loadDataIfNeeded(): TaskDto[] {
  if (isLoaded) {
    return demoTasks;
  }
  const tasks = loadData();
  if (!tasks) {
    throw new Error("Could not load data");
  }
  isLoaded = true;
  return tasks;
}

function saveData() {
  if (!global.window) {
    console.warn("global.window is not defined");
    return;
  }
  global.window.localStorage.setItem(TASK_KEY, JSON.stringify(demoTasks));
  global.window.localStorage.setItem(
    TASK_ID_COUNTER_KEY,
    JSON.stringify(demoTaskIdCounter)
  );
}

function findTask(tasks: TaskDto[], id: string): TaskDto {
  const foundTask = tasks.find(({ id: taskId }) => taskId === id);
  if (!foundTask) {
    throw new Error(`Couldn't find task with id "${id}"`);
  }
  return foundTask;
}

function findTaskIndex(tasks: TaskDto[], id: string): number {
  const foundTaskIndex = findIndex(tasks, ({ id: taskId }) => taskId === id);
  if (!foundTaskIndex) {
    throw new Error(`Couldn't find task with id "${id}"`);
  }
  return foundTaskIndex;
}

export async function decryptJwt() {
  throw new Error("not implemented in demo mode");
}

export async function getTasks({
  tag = "",
}: {
  tag?: string;
} = {}): Promise<TaskDto[]> {
  // clone the array to be safe
  const [...tasks] = loadDataIfNeeded();
  if (tag) {
    return tasks.filter(({ tags: taskTags }) => taskTags?.includes(tag));
  }
  return tasks;
}

type ActionDtoWithDayjs = Modify<
  ActionDto,
  {
    timestamp: Dayjs;
    postponeUntilDate?: Dayjs;
  }
>;
type TaskDtoWithDayjs = Modify<
  TaskDto,
  {
    startDate: Dayjs;
    endDate: Dayjs;
    completedDate?: Dayjs;
    actions?: ActionDtoWithDayjs[];
  }
>;

function mapTaskDtoDateFieldsToDayjs(task: TaskDto): TaskDtoWithDayjs {
  const newTask: TaskDtoWithDayjs = {
    ...task,
    startDate: dayjs(task.startDate),
    endDate: dayjs(task.endDate),
    completedDate: undefined, // hacky TS workaround
    actions: undefined, // hacky TS workaround
  };
  if (task.completedDate) {
    newTask.completedDate =
      task.completedDate === undefined ? undefined : dayjs(task.completedDate);
  }
  if (task.actions) {
    newTask.actions = task.actions.map((action) => {
      const mappedAction: ActionDtoWithDayjs = {
        timestamp: dayjs(action.timestamp),
        postponeUntilDate: undefined, // hacky TS workaround
      };
      if (isPostponeAction(action as any)) {
        // TODO fix typing
        mappedAction.postponeUntilDate = dayjs(
          (action as any).postponeUntilDate
        );
      }
      return mappedAction;
    });
  }
  return newTask;
}

function unmapTaskDtoDateFieldsToDayjs(task: TaskDtoWithDayjs): TaskDto {
  const newTask: TaskDto = {
    ...task,
    startDate: task.startDate.toString(),
    endDate: task.endDate.toString(),
    completedDate: undefined, // hacky TS workaround
    actions: undefined, // hacky TS workaround
  };
  if (task.completedDate) {
    newTask.completedDate =
      task.completedDate === undefined
        ? undefined
        : task.completedDate.toString();
  }
  if (task.actions) {
    newTask.actions = task.actions.map((action) => {
      const mappedAction = {
        timestamp: action.toString(),
        postponeUntilDate: undefined, // hacky TS workaround
      };
      if (isPostponeAction(action)) {
        // TODO fix typing
        mappedAction.postponeUntilDate = (
          action as any
        ).postponeUntilDate.toString();
      }
      return mappedAction;
    });
  }
  return newTask;
}

export async function getTasksForDay(
  day: Dayjs
): Promise<Record<string, TaskDto[]>> {
  // clone the array to be safe
  const [...tasks] = loadDataIfNeeded().map(mapTaskDtoDateFieldsToDayjs);
  const currentDay = dayjs();
  const tasksForDay = calculateTasksForDay(tasks, day, currentDay);
  return {
    [formatDayKey(day)]: tasksForDay.map(unmapTaskDtoDateFieldsToDayjs),
  };
}

export async function getTasksForDayRange(
  startDay: Dayjs,
  endDay: Dayjs
): Promise<Record<string, TaskDto[]>> {
  // clone the array to be safe
  const [...tasks] = loadDataIfNeeded().map(mapTaskDtoDateFieldsToDayjs);
  const currentDay = dayjs();
  const dayToTasksMap = calculateTasksForDayRange(
    tasks,
    startDay,
    endDay,
    currentDay
  );
  return Object.fromEntries(
    Object.entries(dayToTasksMap).map(([dayKey, dayTasks]) => [
      dayKey,
      dayTasks.map(unmapTaskDtoDateFieldsToDayjs),
    ])
  );
}

export async function completeTask(
  completedTaskId: string,
  completedDate: Date
): Promise<string | undefined> {
  const tasks = loadDataIfNeeded();
  const foundTask = findTask(tasks, completedTaskId);

  let newStartDate: Dayjs | undefined = undefined;
  if (foundTask.repeatDays) {
    newStartDate = dayjs(completedDate)
      .startOf("day")
      .add(foundTask.repeatDays, "days");
    await createTask({
      ...foundTask,
      startDate: newStartDate.toString(),
      endDate: newStartDate.add(foundTask.rangeDays - 1, "days").toString(), // minus one because range is [start of startDate, end of endDate]
    });
  }
  foundTask.completedDate = completedDate.toString();
  saveData();
  // if a new (repeating) task was created, return its startDate
  return newStartDate?.toString();
}

export async function postponeTask(
  taskId: string,
  postponeUntilDate: Dayjs
): Promise<void> {
  const [...tasks] = loadDataIfNeeded();
  const foundTask = findTask(tasks, taskId);
  const postponeAction = {
    timestamp: dayjs().toString(),
    postponeUntilDate: getCanonicalDatestring(postponeUntilDate),
  } as unknown as PostponeActionDto; // hmmm I think I need to change the `Action` types to be string instead of Date?

  if (foundTask.actions) {
    foundTask.actions.push(postponeAction);
  } else {
    foundTask.actions = [postponeAction];
  }
  saveData();
}

// TODO or should the type be TaskViewModel then we'll just convert to TaskDto?
export async function createTask(task: CreateTaskDto): Promise<string> {
  const tasks = loadDataIfNeeded();
  const id = demoTaskIdCounter.toString();
  const {
    title,
    startDate,
    endDate,
    rangeDays,
    repeatDays,
    timeEstimateMins,
    tags,
  } = task;
  tasks.push({
    id,
    userId: DEMO_USER_ID,
    title,
    startDate: startDate.toString(),
    endDate: endDate.toString(),
    rangeDays,
    repeatDays,
    timeEstimateMins,
    tags,
  });
  demoTaskIdCounter += 1;
  saveData();
  return id;
}

export async function patchTask(
  taskId: string,
  task: PatchTaskDto
): Promise<string> {
  const tasks = loadDataIfNeeded();
  const foundTask = findTask(tasks, taskId);
  for (const [field, patch] of Object.entries(task) as Entries<typeof task>) {
    if (patch!.op === "remove") {
      delete foundTask[field];
    } else {
      // operation is "update"
      // this workaround smells but idk TypeScript well enough (yet) to fix it in a better way
      foundTask[field] = patch!.value as never;
    }
  }
  saveData();
  return taskId;
}

export async function deleteTask(taskId: string): Promise<void> {
  const tasks = loadDataIfNeeded();
  const foundTaskIndex = findTaskIndex(tasks, taskId);
  tasks.splice(foundTaskIndex, 1);
  saveData();
}

export async function deleteAllTasks(): Promise<void> {
  let tasks = loadDataIfNeeded();
  tasks = [];
  demoTaskIdCounter = 0;
  saveData();
}

export async function getTagCounts(): Promise<Record<string, number>> {
  const tasks = loadDataIfNeeded();
  const tagCounts: Record<string, number> = {};
  for (const { tags } of tasks) {
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
  throw new Error("not implemented in demo mode");
}

export async function registerUser(
  email: string,
  password: string
): Promise<void> {
  throw new Error("not implemented in demo mode");
}

export async function requestResetPassword(email: string): Promise<void> {
  throw new Error("not implemented in demo mode");
}

export async function setNewPassword(
  token: string,
  password: string
): Promise<void> {
  throw new Error("not implemented in demo mode");
}

export async function sendInvitation(inviteeEmail: string): Promise<void> {
  throw new Error("not implemented in demo mode");
}
