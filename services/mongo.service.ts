import type { TaskDao, TaskInsertDao, TaskUpdateDao } from '@/types/task.dao';
import { MongoClient, Collection, ObjectId, WithoutId, OptionalId } from 'mongodb';
import dayjs from 'dayjs';
import { UserDao } from '@/types/user.dao';
import { SessionDao } from '@/types/session.dao';
import { randomBytes } from 'crypto';

const URL = `mongodb://127.0.0.1:27017`; // TODO load from env var
const client = new MongoClient(URL);

// const DB_NAME = 'TodoApp'; // TODO load from env var
const DB_NAME = 'TodoApp-2'; // TODO load from env var
// const TASKS_COLLECTION_NAME = 'tasks'; // TODO load from env var
const TASKS_COLLECTION_NAME = 'task'; // TODO load from env var
let taskCollection: Collection<TaskDao> | null = null;
const USERS_COLLECTION_NAME = 'user'; // TODO
let userCollection: Collection<UserDao> | null = null;
const SESSION_COLLECTION_NAME = 'session';
let sessionCollection: Collection<SessionDao> | null = null;

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

  const adjustedDate = dayjs(targetDay)
    .startOf('day')
    .add(1, 'day')
    // TODO maybe just endOf('day') instead?
    .toDate();
  const filter = {
    completedDate: { $exists: false },
    startDate: { $lt: adjustedDate },
  };
  const tasks = await taskCollection!.find(filter).toArray();

  // TODO maybe there's a way to do this with an aggregate pipeline?
  if (includeCompleted) {
    const completedFilter = {
      completedDate: { 
        $gte: dayjs(targetDay).startOf('day').toDate(),
        $lte: adjustedDate,
      },
    };
    tasks.push(...await taskCollection!.find(completedFilter).toArray());
  }

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

export async function getUserByEmail(email: string): Promise<UserDao|null> {
  await initIfNeeded();
  return userCollection!.findOne({ email });
}

export async function createSession(userId: ObjectId|string): Promise<string> {
  await initIfNeeded();
  // userId is assumed to be valid
  const userOid = userId instanceof ObjectId ? userId : new ObjectId(userId);
  const token = randomBytes(16).toString('hex');
  const insertResult = await sessionCollection!.insertOne({ 
    userId: userOid,
    token,
    createdAt: new Date(),
    ttlMinutes: 60 * 24 * 7, // 7 days
  });
  if (!insertResult) {
    throw new Error('Failed to create session token');
  }
  return token;
}

export async function init() {
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    taskCollection = db.collection<TaskDao>(TASKS_COLLECTION_NAME);
    userCollection = db.collection<UserDao>(USERS_COLLECTION_NAME);
    sessionCollection = db.collection<SessionDao>(SESSION_COLLECTION_NAME);
  } catch (maybeError: any) {
    console.error(maybeError);
  }
}

async function initIfNeeded() {
  if (!taskCollection) {
    await init();
  }
}
