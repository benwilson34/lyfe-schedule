import { ObjectId, OptionalId, WithoutId } from 'mongodb';
import { Modify } from '@/util/types';
import { TokenPayloadDto } from './tokenPayload.dto';
import dayjs from "@/lib/dayjs";

export type TokenPayloadDao = OptionalId<Modify<TokenPayloadDto, {
  expiresDate: Date,
  payload: string, // while I'm using Mongo I guess I could just use a BSON type
}>>;

export function tokenPayloadDaoToDto(tokenPayloadDao: TokenPayloadDao): TokenPayloadDto {
  const { _id, token, action, expiresDate, payload } = tokenPayloadDao;
  return {
    ...(_id && { id: _id.toString() }),
    token,
    action,
    expiresDate: expiresDate.toISOString(),
    payload: JSON.parse(payload),
  } as TokenPayloadDto;
}

export function tokenPayloadDtoToDao(tokenPayloadDto: TokenPayloadDto): TokenPayloadDao {
  const { id, token, action, expiresDate, payload } = tokenPayloadDto;
  return {
    ...(id && { _id: id }),
    token,
    action,
    expiresDate: dayjs(expiresDate).toDate(),
    payload: JSON.stringify(payload),
  } as TokenPayloadDao;
}
