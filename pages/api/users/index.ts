import type { NextApiRequest, NextApiResponse } from "next";
import argon2 from "argon2";
import { randomBytes } from "crypto";
import dayjs from "dayjs";
import { assign } from "lodash";
import ErrorResponse, { internalErrorResponse, unauthenticatedErrorResponse } from "@/models/ErrorResponse";
import SuccessResponse from "@/models/SuccessResponse";
import { addTokenPayload, addUser, deleteTokenPayload, getTokenPayloadByToken, getUser, getUserByEmail, updateUser } from "@/services/mongo.service";
import { userDaoToDto } from "@/types/user.dao";
import { sendMail } from "@/services/email.service";
import { ADMIN_USER_ID, BASE_URL, INVITATION_TOKEN_TTL_MINS, PASSWORD_RESET_TOKEN_TTL_MINS } from "@/util/env";
import { formatFriendlyFullDate } from "@/util/format";
import { TokenPayloadDao, tokenPayloadDaoToDto } from "@/types/tokenPayload.dao";
import { TokenPayloadAction, TokenPayloadDto } from "@/types/tokenPayload.dto";
import { getToken } from "next-auth/jwt";


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
  const { email } = req.body;
  if (!email) {
    new ErrorResponse({
      status: 400,
      errorCode: 'invalidFields',
      title: 'Could not reset password: missing email',
      detail: `Could not reset the password because the user's email was not provided. Please add the \`email\` field to the request body and try again.`,
    }).send(res);
    return;
  }
  const foundUser = await getUserByEmail(email);
  if (!foundUser) {
    unauthenticatedErrorResponse.send(res);
    return;
  }

  // generate token payload
  const token = generateToken();
  const expiresDate = dayjs().add(PASSWORD_RESET_TOKEN_TTL_MINS, 'minutes');
  const insertedId = await addTokenPayload({
    token,
    action: 'request-password-reset',
    expiresDate: expiresDate.toDate(),
    payload: JSON.stringify({ 
      userId: foundUser._id!,
      userEmail: email,
    }),
  });
  if (!insertedId) {
    internalErrorResponse.send(res);
    return;
  }
  // TODO should invalidate previous codes here?

  console.log('about to send email...'); // TODO remove
  await sendMail({
    to: email,
    subject: "Password reset request",
    text: `A password reset has been requested for ${email}. If you did not request this, feel free to ignore this email.

    DO NOT forward this email or send the link to anyone. This link will be valid until ${formatFriendlyFullDate(expiresDate)}.
    
    Click here to reset your password: ${BASE_URL}/auth/reset-password?token=${token}`,
  });
  new SuccessResponse().send(res);
}

function generateToken() {
  return randomBytes(16).toString('hex');
}

// TODO move to different module
export async function getTokenPayload(token: string, action: TokenPayloadAction) {
  const tokenPayload = await getTokenPayloadByToken(token);
  if (!tokenPayload) {
    return null;
  }
  const isExpired = tokenPayload && dayjs().isAfter(tokenPayload.expiresDate);
  if (isExpired || tokenPayload.action !== action) {
    return null;
  }
  return tokenPayloadDaoToDto(tokenPayload);
}

async function checkToken(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // TODO wrap with try-catch
  const { token, tokenAction } = req.body;
  // TODO validate
  const invalidFieldsResponse = new ErrorResponse({
    status: 400,
    errorCode: 'invalidFields',
    title: 'Invalid token',
    detail: `The token was either not supplied or not valid.`,
  });
  if (!token || !tokenAction) {
    invalidFieldsResponse.send(res);
    return;
  }
  const tokenPayload = await getTokenPayload(token, tokenAction);
  if (!tokenPayload) {
    invalidFieldsResponse.send(res);
    return;
  }
  new SuccessResponse({ data: {
    // is it safe to send the whole object?
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
  const tokenPayload = await getTokenPayload(token, 'request-password-reset');
  if (!tokenPayload) {
    new ErrorResponse({
      status: 400,
      errorCode: 'invalidFields',
      title: 'Could not set password: invalid fields',
      detail: `The password could not be set because one or more fields were invalid. TODO more details.`,
    }).send(res);
    return;
  }
  const { userId, userEmail } = tokenPayload.payload;
  const hashedPassword = await hashPassword(password);
  const updateUserResult = await updateUser(userId, { hashedPassword });
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
    to: userEmail,
    subject: 'Your password was reset',
    text: `This is a confirmation that the password for ${userEmail} was successfully reset at ${formatFriendlyFullDate(dayjs())}.
    
    If you didn't reset your password, please reset it again here: ${BASE_URL}/auth/request-reset-password?email=${encodeURIComponent(userEmail)}`,
  });
  new SuccessResponse().send(res);
}

async function sendInvitation(req: NextApiRequest, res: NextApiResponse) {
  try {
    // auth
    const authToken = await getToken({ req });
    if (!authToken) {
      unauthenticatedErrorResponse.send(res);
      return;
    }
    const userId = authToken.sub!;
    
    // check session token to confirm it's an admin
    if (!ADMIN_USER_ID || userId !== ADMIN_USER_ID) {
      new ErrorResponse({
        status: 403,
        errorCode: 'unauthorized',
        title: 'Could not send invite',
        detail: `You are not authorized to send invitations in this environment.`,
      }).send(res);
      return;
    }

    const { inviteeEmail } = req.body;
    // TODO validate
    if (!inviteeEmail) {
      new ErrorResponse({
        status: 400,
        errorCode: 'invalidFields',
        title: 'Could not send invite: one or more invalid fields',
        detail: `Could not send invite because one or more required fields are invalid. TODO more details.`,
      }).send(res);
      return;
    }
    // TODO check to see if invitee email is already in system?

    const token = generateToken();
    const expiresDate = dayjs().add(INVITATION_TOKEN_TTL_MINS, 'minutes');
    const insertedId = await addTokenPayload({
      token,
      action: 'send-invitation',
      expiresDate: expiresDate.toDate(),
      payload: JSON.stringify({ userEmail: inviteeEmail }),
    });
    if (!insertedId) {
      internalErrorResponse.send(res);
      return;
    }

    await sendMail({
      to: inviteeEmail,
      subject: "You're invited to use LyfeSchedule!",
      text: `Hello! You've been invited to LyfeSchedule, the todo app for people who get things done eventually™.

      This invite code will be valid until ${formatFriendlyFullDate(expiresDate)}.
      
      Click here to activate your account: ${BASE_URL}/auth/accept-invitation?token=${token}`,
    });
    new SuccessResponse().send(res);
  } catch (maybeError: any) {
    // TODO log error
    internalErrorResponse.send(res);
  }
}

async function registerFromInvitation(req: NextApiRequest, res: NextApiResponse) {
  try {
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
    const tokenPayload = await getTokenPayload(token, 'send-invitation');
    if (!tokenPayload) {
      new ErrorResponse({
        status: 400,
        errorCode: 'invalidFields',
        title: 'Could not set password: invalid fields',
        detail: `The password could not be set because one or more fields were invalid. TODO more details.`,
      }).send(res);
      return;
    }
    const { userEmail: email } = tokenPayload.payload;
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      new ErrorResponse({
        status: 400,
        errorCode: 'invalidFields',
        title: 'Could not register new user: email already in use',
        detail: `A user with email "${email}" could not be registered because that email is already in use by another user. This most likely means the user was invited multiple times by accident.`,
      }).send(res);
      return;
    }

    // insert user
    const hashedPassword = await hashPassword(password);
    const insertedId = await addUser({ email, hashedPassword });
    if (!insertedId) {
      throw new Error(`Could not insert new user!`);
    }
    // delete token
    const deleteTokenResult = await deleteTokenPayload(token);
    if (!deleteTokenResult) {
      // TODO is this a critical error? Or can we just log and roll with it?
      throw new Error('Could not delete token')
    }

    await sendMail({
      to: email,
      subject: "Welcome to LyfeSchedule!",
      text: `Welcome to LyfeSchedule!! Thanks for your interest in my little productivity app 😁

      Please remember that this app is somewhere between alpha and beta and is being actively developed. I'm accepting any and all feedback at this time.

      TODO info about feedback/reporting bugs

      TODO link to docs/guide/manual
      
      You can now sign in and start using it immediately! ${BASE_URL}
      
      💚 Ben`,
    });
    new SuccessResponse().send(res);
  } catch (maybeError) {
    // TODO log error
    internalErrorResponse.send(res);
  }
}

async function operateOnUsers(
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
    case 'send-invitation':
      await sendInvitation(req, res);
      break;
    case 'register-from-invitation':
      await registerFromInvitation(req, res);
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
      await operateOnUsers(req, res);
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
