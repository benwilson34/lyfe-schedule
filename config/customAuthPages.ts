// this _has_ to be the same in both `pages/api/auth/[...nextauth].ts` and `middleware.ts`
// see https://github.com/nextauthjs/next-auth/discussions/4136#discussioncomment-2314117
export const customAuthPages = {
  signIn: "/auth/sign-in",
};
