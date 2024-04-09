import type { TaskDao, TaskInsertDao, TaskUpdateDao } from '@/types/task.dao';
import { MongoClient, Collection, ObjectId, WithoutId, OptionalId } from 'mongodb';
import dayjs from 'dayjs';
import { UserDao } from '@/types/user.dao';
import { TokenPayloadDao } from '@/types/tokenPayload.dao';
import { DB_NAME, DB_URL, TASK_COLLECTION_NAME, USER_COLLECTION_NAME, TOKEN_PAYLOAD_COLLECTION_NAME } from '@/util/env';

const client = new MongoClient(DB_URL);
let taskCollection: Collection<TaskDao> | null = null;
let userCollection: Collection<UserDao> | null = null;
let tokenPayloadCollection: Collection<TokenPayloadDao> | null = null;

// TODO require userId?
export async function getTaskById(id: ObjectId|string): Promise<TaskDao|null> {
  await initIfNeeded();
  const oid = id instanceof ObjectId ? id : new ObjectId(id);
  const targetTask = await taskCollection!.findOne({ _id: oid });
  return targetTask;
}

export async function getManyTasks(userId: string|ObjectId, { targetDay, includeCompleted = false }: { targetDay?: Date; includeCompleted?: boolean; } = {}): Promise<TaskDao[]> {
  await initIfNeeded();

  const userOid = userId instanceof ObjectId ? userId : new ObjectId(userId);
  const adjustedDate = dayjs(targetDay)
    .startOf('day')
    .add(1, 'day')
    // TODO maybe just endOf('day') instead?
    .toDate();
  const filter = {
    userId: userOid,
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
  // TODO validate task? or trust caller?
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

export async function deleteAllTasks(userId: string|ObjectId): Promise<number> {
  await initIfNeeded();
  const userOid = userId instanceof ObjectId ? userId : new ObjectId(userId);
  const deleteResult = await taskCollection!.deleteMany({ userId: userOid });
  return deleteResult.deletedCount;
}

export async function getUserByEmail(email: string): Promise<UserDao|null> {
  await initIfNeeded();
  return userCollection!.findOne({ email });
}

export async function getUser(id: string|ObjectId): Promise<UserDao|null> {
  await initIfNeeded();
  const oid = id instanceof ObjectId ? id : new ObjectId(id);
  return userCollection!.findOne({ _id: oid });
}

export async function updateUser(id: ObjectId|string, user: WithoutId<Partial<UserDao>>): Promise<string> {
  await initIfNeeded();
  // TODO validate task
  const oid = id instanceof ObjectId ? id : new ObjectId(id);
  // FIXME need to learn how "casting" in Typescript should work
  delete user.id; // just to make sure
  
  const { modifiedCount } = await userCollection!.updateOne({ _id: oid }, { $set: { ...user } });
  
  if (modifiedCount !== 1) {
    throw new Error(`Modified ${modifiedCount} documents instead of 1. Maybe there weren't any actual changes in the set?`);
  }
  return oid.toString();
}

export async function addTokenPayload(tokenPayload: OptionalId<TokenPayloadDao>): Promise<string> {
  await initIfNeeded();
  const insertResult = await tokenPayloadCollection!.insertOne(tokenPayload);
  return insertResult.insertedId.toString();
}

export async function getTokenPayloadByToken(token: string): Promise<TokenPayloadDao|null> {
  await initIfNeeded();
  return tokenPayloadCollection!.findOne({ token });
}

// TODO should take _id instead?
export async function deleteTokenPayload(token: string): Promise<string> {
  const { deletedCount } = await tokenPayloadCollection!.deleteOne({ token });
  if (deletedCount !== 1) {
    throw new Error(`Deleted ${deletedCount} documents instead of 1`);
  }
  return token;
}

export async function init() {
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    taskCollection = db.collection<TaskDao>(TASK_COLLECTION_NAME || 'task');
    userCollection = db.collection<UserDao>(USER_COLLECTION_NAME || 'user');
    tokenPayloadCollection = db.collection<TokenPayloadDao>(TOKEN_PAYLOAD_COLLECTION_NAME || 'tokenPayload');
  } catch (maybeError: any) {
    console.error(maybeError);
  }
}

async function initIfNeeded() {
  if (!taskCollection) {
    await init();
  }
}
