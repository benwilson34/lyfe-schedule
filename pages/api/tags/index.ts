// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getAllTags as getAllTagsInDb } from "@/services/mongo.service";
import ErrorResponse, {
  internalErrorResponse,
  unauthenticatedErrorResponse,
} from "@/models/ErrorResponse";
import SuccessResponse from "@/models/SuccessResponse";
import { getToken } from "next-auth/jwt";
import { handleUnimplementedEndpoint } from "@/util/apiResponse";
import { IS_DEMO_MODE } from "@/util/env";

function handleError(maybeError: any, res: NextApiResponse) {
  console.error(maybeError);
  internalErrorResponse.send(res);
}

/**
 * Successful response has body in this shape:
 * {
 *   tagCounts: {
 *      "tag-1": 3,
 *      "tag-2": 12,
 *      ...
 *   }
 * }
 */
async function getAllTags(req: NextApiRequest, res: NextApiResponse) {
  try {
    // auth
    const token = await getToken({ req });
    if (!token) {
      unauthenticatedErrorResponse.send(res);
      return;
    }
    const userId = token.sub!;

    const tagCounts = await getAllTagsInDb(userId);
    new SuccessResponse({
      data: { tagCounts },
    }).send(res);
  } catch (maybeError: any) {
    handleError(maybeError, res);
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`${req.method} ${req.url}`); // TODO replace with proper logging
  switch (req.method?.toUpperCase()) {
    case "GET":
      await getAllTags(req, res);
      break;
    default:
      handleUnimplementedEndpoint(req, res);
      break;
  }
}

export default IS_DEMO_MODE ? handleUnimplementedEndpoint : handler;
