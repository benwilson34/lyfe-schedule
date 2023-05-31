import type { ResponseCode } from "./responseCode";
import { NextApiResponse } from "next";

export default class SuccessResponse {
  status: number;
  body: Record<string, any>;

  constructor(
    { status = 200, responseCode = 'success', title, detail, data }:
      { status?: 200 | 201, responseCode?: ResponseCode, title: string, detail: string, data?: any }
  ) {
    this.status = status;
    this.body = {
      responseCode,
      title,
      detail,
      ...(data && { data }),
    };
  }

  public send(res: NextApiResponse) {
    res.status(this.status).json(this.body);
  }
}
