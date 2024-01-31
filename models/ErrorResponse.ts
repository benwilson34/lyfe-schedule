import type { ErrorCode } from "./errorCode";
import { NextApiResponse } from "next";

export default class ErrorResponse {
  status: number;
  body: Record<string, any>;

  constructor(
    { status, errorCode, title, detail, error }:
      { status: 400 | 401 | 404 | 500, errorCode: ErrorCode, title: string, detail: string, error?: Error | string }
  ) {
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
  errorCode: 'internalError',
  title: 'Internal server error',
  detail: 'An internal error has occurred. Please try again later or contact the admin.',
});
