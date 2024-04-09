import { ObjectId, OptionalId, WithoutId } from 'mongodb';
import { Modify } from '@/util/types';
import { TokenPayloadDto } from './tokenPayload.dto';
import dayjs from 'dayjs';

export type TokenPayloadDao = OptionalId<Modify<TokenPayloadDto, {
  userId: ObjectId,
  expiresDate: Date,
}>>;

export function tokenPayloadDaoToDto(tokenPayloadDao: TokenPayloadDao): TokenPayloadDto {
  const { _id, token, userId, expiresDate } = tokenPayloadDao;
  return {
    ...(_id && { id: _id.toString() }),
    token,
    userId: userId.toString(),
    expiresDate: expiresDate.toISOString(),
  } as TokenPayloadDto;
}

export function tokenPayloadDtoToDao(tokenPayloadDto: TokenPayloadDto): TokenPayloadDao {
  const { id, token, userId, expiresDate } = tokenPayloadDto;
  return {
    ...(id && { _id: id }),
    token,
    userId: new ObjectId(userId),
    expiresDate: dayjs(expiresDate).toDate(),
  } as TokenPayloadDao;
}
