import ErrorResponse, {
  unauthenticatedErrorResponse,
} from "@/models/ErrorResponse";
import SuccessResponse from "@/models/SuccessResponse";
import { handleUnimplementedEndpoint } from "@/util/apiResponse";
import { ADMIN_USER_ID, IS_DEMO_MODE } from "@/util/env";
import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

// Dunno whether it's a terrible idea to expose this or not. See `pages/_app.tsx` for why this is needed.
async function decryptJwt(req: NextApiRequest, res: NextApiResponse) {
  const token = await getToken({ req });
  if (!token) {
    unauthenticatedErrorResponse.send(res);
    return;
  }
  const userId = token.sub!;
  const isAdmin = ADMIN_USER_ID && userId === ADMIN_USER_ID;
  new SuccessResponse({
    data: {
      userId,
      isAdmin,
    },
  }).send(res);
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method?.toUpperCase()) {
    case "GET":
      await decryptJwt(req, res);
      break;
    default:
      handleUnimplementedEndpoint(req, res);
      break;
  }
}

export default IS_DEMO_MODE ? handleUnimplementedEndpoint : handler;
