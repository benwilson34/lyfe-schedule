// see https://next-auth.js.org/configuration/nextjs#middleware

import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { customAuthPages } from "./config/customAuthPages";
import { IS_DEMO_BUILD } from "./util/env";

export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent
) {
  // don't run auth middleware when the app is in demo mode
  if (IS_DEMO_BUILD) {
    return; // this ok?
  }

  const token = await getToken({ req });
  const isAuthenticated = !!token;

  // prevent visiting sign-in page if already signed in
  // see https://stackoverflow.com/a/76178353
  if (
    req.nextUrl.pathname.startsWith(customAuthPages.signIn) &&
    isAuthenticated
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // don't run on `/auth` pages
  if (req.nextUrl.pathname.startsWith("/auth")) {
    console.log(req.nextUrl.pathname);
    console.log("about to allow auth page"); // TODO remove
    return; // this ok?
  }

  const authMiddleware = withAuth({
    pages: customAuthPages,
  });

  // @ts-expect-error
  return authMiddleware(req, event);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
