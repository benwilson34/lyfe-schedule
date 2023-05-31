import type { ResponseCode } from "./responseCode";
import { NextApiResponse } from "next";

export default class ErrorResponse {
  status: number;
  body: Record<string, any>;

  constructor(
    { status, responseCode, title, detail, error }:
      { status: 400 | 404 | 500, responseCode: ResponseCode, title: string, detail: string, error?: Error | string }
  ) {
    this.status = status;
    this.body = {
      responseCode,
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
  responseCode: 'internalError',
  title: 'TODO',
  detail: 'TODO',
});
