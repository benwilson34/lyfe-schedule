import { NextApiRequest } from "next";

const HEADER_KEY = "X-Timezone-Offset";

// see https://stackoverflow.com/questions/8690911/finding-timezone-in-httprequest-from-server-side
export function getTimezoneOffsetHeader(): Record<string, string> {
  return { [HEADER_KEY]: new Date().getTimezoneOffset().toString() };
}

export function getTimezoneOffsetFromHeader(
  req: NextApiRequest
): number | null {
  const headerValue = req.headers[HEADER_KEY.toLowerCase()];
  if (!headerValue || Array.isArray(headerValue)) {
    return null;
  }
  return parseInt(headerValue, 10);
}
