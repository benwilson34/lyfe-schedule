import type { NextApiRequest, NextApiResponse } from "next/types";
import ErrorResponse from "@/models/ErrorResponse";

export function handleUnimplementedEndpoint(
  req: NextApiRequest,
  res: NextApiResponse
) {
  new ErrorResponse({
    status: 404,
    errorCode: "resourceNotFound",
    title: "Resource not found",
    detail: `Can not ${req.method} ${req.url}`,
  }).send(res);
}
