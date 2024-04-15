// by default we'll secure all pages
// see https://next-auth.js.org/configuration/nextjs#middleware
// export { default } from 'next-auth/middleware';

import { withAuth } from "next-auth/middleware";

export default withAuth({
  // TODO this _has_ to be the same as in `pages/api/auth/[...nextauth].ts`, so maybe it should be in its own module?
  // see https://github.com/nextauthjs/next-auth/discussions/4136#discussioncomment-2314117
  pages: {
    signIn: '/auth/sign-in',
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - auth (auth pages)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
