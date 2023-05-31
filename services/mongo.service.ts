import type { TaskDto } from '@/types/task.dto';
import type { TaskDao, TaskInsertDao } from '@/types/task.dao';
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

export async function updateTask(id: ObjectId|string, task: TaskDto): Promise<boolean> {
  await initIfNeeded();
  // TODO validate task
  const oid = id instanceof ObjectId ? id : new ObjectId(id);
  console.log(task as any);
  // FIXME need to learn how "casting" in Typescript should work
  const updatedResult = await tasks!.updateOne({ _id: oid }, { $set: { ...task } });
  return updatedResult.modifiedCount === 1;
}

export async function deleteTask(id: ObjectId|string): Promise<boolean> {
  await initIfNeeded();
  const oid = id instanceof ObjectId ? id : new ObjectId(id);
  const deleteResult = await tasks!.deleteOne({ _id: oid });
  return deleteResult.deletedCount === 1;
}

export async function deleteAllTasks(): Promise<number> {
  await initIfNeeded();
  const deleteResult = await tasks!.deleteMany();
  return deleteResult.deletedCount;
}

export async function init() {
  try {
    console.log('>> trying to connect to mongo...');
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
