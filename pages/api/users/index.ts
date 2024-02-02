// TODO this isn't really needed anymore until we support registration or other user operations



import type { NextApiRequest, NextApiResponse } from "next";
import argon2 from "argon2";
import ErrorResponse, { internalErrorResponse } from "@/models/ErrorResponse";
import SuccessResponse from "@/models/SuccessResponse";
import { getUserByEmail } from "@/services/mongo.service";
import { userDaoToDto } from "@/types/user.dao";

async function hashPassword(
  req: NextApiRequest,
  res: NextApiResponse
) { 
  // TODO remove!!
  const { password } = req.body;
  if (!password) {
    new ErrorResponse({
      status: 400,
      errorCode: 'invalidFields',
      title: 'TODO',
      detail: 'Required field `password` was not supplied.',
    }).send(res);
    return;
  }
  const hashedPassword = await argon2.hash(password);
  new SuccessResponse({ data: { hashedPassword } }).send(res);
}

// async function loginUser(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) { 
//   console.log('Going to try to auth user'); // TODO remove
//   try {
//     const { email, password } = req.body;
//     // TODO validate

//     const failedLoginResponse = new ErrorResponse({
//       status: 401,
//       errorCode: 'failedLogin',
//       title: 'Could not log in',
//       detail: `Could not log in user with email "${email}".`,
//     })
//     const foundUser = await getUserByEmail(email);
//     console.log('foundUser', foundUser); // TODO remove
    
//     if (!foundUser) {
//       failedLoginResponse.send(res);
//       return;
//     }
//     const passwordDoesMatch = await argon2.verify(foundUser.hashedPassword!, password);
//     if (!passwordDoesMatch) {
//       failedLoginResponse.send(res);
//       return;
//     }

//     // actually we're not gonna send a session token this way?
//     // const sessionToken = await createSession(foundUser._id!);

//     new SuccessResponse({
//       data: { user: userDaoToDto(foundUser) }
//     }).send(res);
//   } catch (maybeError: any) {
//     // TODO log
//     console.error(maybeError);
//     internalErrorResponse.send(res);
//   }
// }

async function operateOnTasks(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // TODO validate body?
  const { operation, ...options } = req.body;
  if (!operation) {
    new ErrorResponse({
      status: 400,
      errorCode: 'invalidFields',
      title: 'TODO',
      detail: 'TODO',
    }).send(res);
  }
  switch (operation.toLowerCase()) {
    case 'hash':
      await hashPassword(req, res);
      break;
    // case 'login':
      // await loginUser(req, res);
      // break;
    default:
      new ErrorResponse({
        status: 400,
        errorCode: 'invalidFields',
        title: 'Invalid operation',
        detail: `The provided operation "${operation}" is not valid.`,
      }).send(res);
      return;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method?.toUpperCase()) {
    case 'POST':
      // TODO register new user?
      break;
    case 'PUT':
      await operateOnTasks(req, res);
      break;
    default:
      new ErrorResponse({
        status: 404,
        errorCode: 'resourceNotFound',
        title: 'Resource not found',
        detail: `Can not ${req.method} ${req.url}`,
      }).send(res);
      break;
  }
}
