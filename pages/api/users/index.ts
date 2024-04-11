// TODO this isn't really needed anymore until we support registration or other user operations



import type { NextApiRequest, NextApiResponse } from "next";
import argon2 from "argon2";
import { randomBytes } from "crypto";
import dayjs from "dayjs";
import { assign } from "lodash";
import ErrorResponse, { internalErrorResponse, unauthenticatedErrorResponse } from "@/models/ErrorResponse";
import SuccessResponse from "@/models/SuccessResponse";
import { addTokenPayload, deleteTokenPayload, getTokenPayloadByToken, getUser, getUserByEmail, updateUser } from "@/services/mongo.service";
import { userDaoToDto } from "@/types/user.dao";
import { sendMail } from "@/services/email.service";
import { BASE_URL, PASSWORD_RESET_TOKEN_TTL_MINS } from "@/util/env";
import { formatFriendlyFullDate } from "@/util/format";
import { TokenPayloadDao, tokenPayloadDaoToDto } from "@/types/tokenPayload.dao";
import { TokenPayloadDto } from "@/types/tokenPayload.dto";


async function hashPassword(password: string) { 
  return argon2.hash(password);
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

async function requestResetPassword(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // TODO wrap with try-catch
  const { email: toEmail } = req.body;
  if (!toEmail) {
    new ErrorResponse({
      status: 400,
      errorCode: 'invalidFields',
      title: 'Could not reset password: missing email',
      detail: `Could not reset the password because the user's email was not provided. Please add the \`email\` field to the request body and try again.`,
    }).send(res);
    return;
  }
  const foundUser = await getUserByEmail(toEmail);
  if (!foundUser) {
    unauthenticatedErrorResponse.send(res);
    return;
  }

  // generate token payload
  const token = randomBytes(16).toString('hex');
  const expiresDate = dayjs().add(PASSWORD_RESET_TOKEN_TTL_MINS || 120, 'minutes');
  const insertedId = await addTokenPayload({
    token,
    userId: foundUser._id!,
    expiresDate: expiresDate.toDate(),
  });
  if (!insertedId) {
    internalErrorResponse.send(res);
    return;
  }
  // TODO should invalidate previous codes here?

  console.log('about to send email...'); // TODO remove
  await sendMail({
    to: toEmail,
    subject: "Password reset request",
    text: `A password reset has been requested for ${toEmail}. If you did not request this, feel free to ignore this email.

    DO NOT forward this email or send the link to anyone. This link will be valid until ${formatFriendlyFullDate(expiresDate)}.
    
    Click here to reset your password: ${BASE_URL}/auth/reset-password?token=${token}`,
  });
  new SuccessResponse().send(res);
}

// TODO move to different module
export async function getTokenPayload(token: string, doesConvertToDto: boolean = false) {
  // TODO refactor or fix type here
  let tokenPayload: any = await getTokenPayloadByToken(token);
  if (!tokenPayload) {
    return null;
  }
  const isExpired = tokenPayload && dayjs().isAfter(tokenPayload.expiresDate);
  if (isExpired) {
    return null;
  }
  if (doesConvertToDto) {
    tokenPayload = tokenPayloadDaoToDto(tokenPayload);
  }
  const user = await getUser(tokenPayload.userId);
  // TODO handle missing/deleted user?
  return assign(tokenPayload, { email: user?.email });
}

async function checkToken(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // TODO wrap with try-catch
  const { token } = req.body;
  // TODO validate
  const invalidFieldsResponse = new ErrorResponse({
    status: 400,
    errorCode: 'invalidFields',
    title: 'Invalid token',
    detail: `The token was either not supplied or not valid.`,
  });
  if (!token) {
    invalidFieldsResponse.send(res);
    return;
  }
  const tokenPayload = await getTokenPayload(token);
  if (!tokenPayload) {
    invalidFieldsResponse.send(res);
    return;
  }
  new SuccessResponse({ data: {
    ...tokenPayload,
  } }).send(res);
}

async function setNewPassword(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // TODO wrap with try-catch
  const { token, password } = req.body;
  // TODO validate
  if (!token || !password) {
    new ErrorResponse({
      status: 400,
      errorCode: 'invalidFields',
      title: 'Could not set password: invalid fields',
      detail: `The password could not be set because one or more fields were invalid. TODO more details.`,
    }).send(res);
    return;
  }
  const tokenPayload = await getTokenPayload(token);
  if (!tokenPayload) {
    new ErrorResponse({
      status: 400,
      errorCode: 'invalidFields',
      title: 'Could not set password: invalid fields',
      detail: `The password could not be set because one or more fields were invalid. TODO more details.`,
    }).send(res);
    return;
  }
  const hashedPassword = await hashPassword(password);
  const updateUserResult = await updateUser(tokenPayload.userId, { hashedPassword });
  if (!updateUserResult) {
    // TODO log
    internalErrorResponse.send(res);
    return;
  }
  const deleteTokenResult = await deleteTokenPayload(token);
  if (!deleteTokenResult) {
    // TODO log
    internalErrorResponse.send(res);
    return;
  }
  await sendMail({
    to: tokenPayload.email,
    subject: 'Your password was reset',
    text: `This is a confirmation that the password for ${tokenPayload.email} was successfully reset at ${formatFriendlyFullDate(dayjs())}.
    
    If you didn't reset your password, please reset it again here: TODO link`,
  });
  new SuccessResponse().send(res);
}

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
    // case 'login':
      // await loginUser(req, res);
      // break;
    case 'request-reset-password':
      await requestResetPassword(req, res);
      break;
    case 'check-token':
      await checkToken(req, res);
      break;
    case 'set-new-password':
      await setNewPassword(req, res);
      break;
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
