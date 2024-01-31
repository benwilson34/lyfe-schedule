import type { ObjectId, OptionalId, WithoutId } from 'mongodb';
import { Modify } from '@/util/types';
import { UserDto } from './user.dto';

export type UserDao = OptionalId<Modify<UserDto, {}>>;

export function userDaoToDto(userDao: UserDao, { includeHashedPassword = false }): UserDto {
  const { _id, email, hashedPassword } = userDao;
  return {
    ...(_id && { id: _id.toString() }),
    email,
    ...(includeHashedPassword && { hashedPassword }),
  } as UserDto;
}

export function taskDtoToDao(userDto: UserDto): UserDao {
  const { id, email, hashedPassword } = userDto;
  return {
    ...(id && { _id: id }),
    email,
    ...(hashedPassword && { hashedPassword })
  } as UserDao;
}
