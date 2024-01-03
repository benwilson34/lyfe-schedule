import type { TaskDao, TaskInsertDao, TaskUpdateDao } from '@/types/task.dao';
import { MongoClient, Collection, ObjectId, WithoutId, OptionalId } from 'mongodb';
import dayjs from 'dayjs';

const URL = `mongodb://127.0.0.1:27017`; // TODO load from env var
const client = new MongoClient(URL);

// const DB_NAME = 'TodoApp'; // TODO load from env var
const DB_NAME = 'TodoApp-2'; // TODO load from env var
// const TASKS_COLLECTION_NAME = 'tasks'; // TODO load from env var
const TASKS_COLLECTION_NAME = 'task'; // TODO load from env var
let taskCollection: Collection<TaskDao> | null = null;

// function taskDaoToDto(taskDao: TaskDao): TaskDto {
//   let dto: any = { ...taskDao };
//   if (taskDao._id) {
//     dto.id = taskDao._id.toString();
//     delete dto._id;
//   }
//   return dto as TaskDto;
// }

export async function getTaskById(id: ObjectId|string): Promise<TaskDao|null> {
  await initIfNeeded();
  const oid = id instanceof ObjectId ? id : new ObjectId(id);
  const targetTask = await taskCollection!.findOne({ _id: oid });
  return targetTask;
}


export async function getManyTasks({ targetDay, includeCompleted = false }: { targetDay?: Date; includeCompleted?: boolean; } = {}): Promise<TaskDao[]> {
  await initIfNeeded();
  if (targetDay) console.log(`Got target day of ${targetDay}`); // TODO remove

  let targetDayFilter = {};
  if (targetDay) {
    const adjustedDate = dayjs(targetDay)
      .add(1, 'day')
      // TODO use dayjs.startOf('day') instead
      .set('hour', 0)
      .set('minute', 0)
      .set('second', 0)
      .toDate();
    targetDayFilter = { startDate: { $lt: adjustedDate }}
  }

  const filter = {
    ...(!includeCompleted && { completedDate: { $exists: false } }),
    ...targetDayFilter,
  };
  const tasks = await taskCollection!.find(filter).toArray();
  return tasks;
}

export async function addTask(newTask: WithoutId<TaskDao>): Promise<string> {
  await initIfNeeded();
  // TODO validate task
  const insertResult = await taskCollection!.insertOne(newTask as OptionalId<TaskDao>);
  return insertResult.insertedId.toString();
}

export async function updateTask(id: ObjectId|string, task: TaskUpdateDao): Promise<string> {
  await initIfNeeded();
  // TODO validate task
  const oid = id instanceof ObjectId ? id : new ObjectId(id);
  // FIXME need to learn how "casting" in Typescript should work
  
  const { modifiedCount } = await taskCollection!.updateOne({ _id: oid }, { $set: { ...task } });
  
  if (modifiedCount !== 1) {
    throw new Error(`Modified ${modifiedCount} documents instead of 1. Maybe there weren't any actual changes in the set?`);
  }
  return oid.toString();
}

export async function deleteTask(id: ObjectId|string): Promise<string> {
  await initIfNeeded();
  const oid = id instanceof ObjectId ? id : new ObjectId(id);
  const { deletedCount } = await taskCollection!.deleteOne({ _id: oid });
  if (deletedCount !== 1) {
    throw new Error(`Deleted ${deletedCount} documents instead of 1`);
  }
  return oid.toString();
}

export async function deleteAllTasks(): Promise<number> {
  await initIfNeeded();
  const deleteResult = await taskCollection!.deleteMany();
  return deleteResult.deletedCount;
}

export async function init() {
  try {
    await client.connect();
    taskCollection = client.db(DB_NAME).collection<TaskDao>(TASKS_COLLECTION_NAME);
    console.log(`Successfully connected to Mongo server at ${URL}`);
  } catch (maybeError: any) {
    console.error(maybeError);
  }
}

async function initIfNeeded() {
  if (!taskCollection) {
    await init();
  }
}
