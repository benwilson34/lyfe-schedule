import type { TaskDto } from '@/types/task.dto';
import type { TaskDao, TaskInsertDao, TaskUpdateDao } from '@/types/task.dao';
import { MongoClient, Collection, ObjectId, WithoutId } from 'mongodb';

const URL = `mongodb://127.0.0.1:27017`; // TODO load from env var
const client = new MongoClient(URL);

const DB_NAME = 'TodoApp'; // TODO load from env var
const TASKS_COLLECTION_NAME = 'tasks'; // TODO load from env var
let tasks: Collection<TaskDao> | null = null;

function taskDaoToDto(taskDao: TaskDao): TaskDto {
  let dto: any = { ...taskDao };
  if (taskDao._id) {
    dto.id = taskDao._id.toString();
    delete dto._id;
  }
  return dto as TaskDto;
}

export async function getTaskById(id: ObjectId|string): Promise<TaskDto|null> {
  await initIfNeeded();
  const oid = id instanceof ObjectId ? id : new ObjectId(id);
  const targetTask = await tasks!.findOne({ _id: oid });
  return targetTask as unknown as TaskDto; // TODO unsure about this conversion
}

export async function getAllTasks(): Promise<TaskDto[]> {
  await initIfNeeded();
  const allTasks = await tasks!.find({ completedDate: { $exists: false } }).toArray();
  return allTasks.map(taskDaoToDto); // TODO unsure about this conversion
}

export async function addTask(newTask: WithoutId<TaskDto>): Promise<string> {
  await initIfNeeded();
  // TODO validate task
  const insertResult = await tasks!.insertOne(newTask);
  return insertResult.insertedId.toString();
}

export async function updateTask(id: ObjectId|string, task: TaskUpdateDao): Promise<string> {
  await initIfNeeded();
  // TODO validate task
  const oid = id instanceof ObjectId ? id : new ObjectId(id);
  // FIXME need to learn how "casting" in Typescript should work
  console.log('task', task); // TODO remove
  
  const { modifiedCount } = await tasks!.updateOne({ _id: oid }, { $set: { ...task } });
  
  if (modifiedCount !== 1) {
    throw new Error(`Modified ${modifiedCount} documents instead of 1`);
  }
  return oid.toString();
}

export async function deleteTask(id: ObjectId|string): Promise<string> {
  await initIfNeeded();
  const oid = id instanceof ObjectId ? id : new ObjectId(id);
  const { deletedCount } = await tasks!.deleteOne({ _id: oid });
  if (deletedCount !== 1) {
    throw new Error(`Deleted ${deletedCount} documents instead of 1`);
  }
  return oid.toString();
}

export async function deleteAllTasks(): Promise<number> {
  await initIfNeeded();
  const deleteResult = await tasks!.deleteMany();
  return deleteResult.deletedCount;
}

export async function init() {
  try {
    await client.connect();
    tasks = client.db(DB_NAME).collection<TaskDao>(TASKS_COLLECTION_NAME);
    console.log(`Successfully connected to Mongo server at ${URL}`);
  } catch (maybeError: any) {
    console.error(maybeError);
  }
}

async function initIfNeeded() {
  if (!tasks) {
    await init();
  }
}
