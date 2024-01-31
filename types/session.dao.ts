import { ObjectId } from "mongodb";

export type SessionDao = {
  _id?: ObjectId;
  userId: ObjectId;
  token: string;
  createdAt: Date;
  // maybe it would be better to calculate the expiration date instead of ttl here?
  ttlMinutes: number;
};
