import { NextApiResponse } from "next";

export default class SuccessResponse {
  status: number;
  body: Record<string, any>;

  constructor(
    { status = 200, data }:
      { status?: 200 | 201, data?: any } = {}
  ) {
    this.status = status;
    this.body = {
      ...(data && { data }),
    };
  }

  public send(res: NextApiResponse) {
    res.status(this.status).json(this.body);
  }
}
