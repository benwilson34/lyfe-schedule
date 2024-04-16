import type { ErrorCode } from "./errorCode";
import { NextApiResponse } from "next";

export default class ErrorResponse {
  status: number;
  body: Record<string, any>;

  constructor({
    status,
    errorCode,
    title,
    detail,
    error,
  }: {
    status: 400 | 401 | 403 | 404 | 500;
    errorCode: ErrorCode;
    title: string;
    detail: string;
    error?: Error | string;
  }) {
    this.status = status;
    this.body = {
      errorCode,
      title,
      detail,
      ...(error && { error }),
    };
  }

  public send(res: NextApiResponse) {
    res.status(this.status).json(this.body);
  }
}

export const internalErrorResponse = new ErrorResponse({
  status: 500,
  errorCode: "internalError",
  title: "Internal server error",
  detail:
    "An internal error has occurred. Please try again later or contact the admin.",
});

export const unauthenticatedErrorResponse = new ErrorResponse({
  status: 401,
  errorCode: "unauthenticated",
  title: "Unauthenticated",
  detail: `Could not complete the request because the authentication was not provided or not valid.`,
});

// TODO make into utility function so that it can take params, like which id was not found
export const notFoundErrorResponse = new ErrorResponse({
  status: 404,
  errorCode: "resourceNotFound",
  title: "Resource not found",
  detail: `The specified resource was not found.`,
});
