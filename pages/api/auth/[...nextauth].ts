import type { NextAuthOptions, User } from "next-auth";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import argon2 from 'argon2';
import { getUserByEmail } from "@/services/mongo.service";
import { userDaoToDto } from "@/types/user.dao";
import { customAuthPages } from "@/config/customAuthPages";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'someone@something.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        try {
          if (!credentials) return null;
          const { email, password } = credentials;
          console.log(`about to sign in ${email}`); // TODO remove
          const foundUser = await getUserByEmail(email);
          
          if (!foundUser) {
            return null;
          }
          const passwordDoesMatch = await argon2.verify(foundUser.hashedPassword!, password);
          if (!passwordDoesMatch) {
            return null;
          }

          return {
            id: userDaoToDto(foundUser).id!
          } as User;
        } catch (maybeError) {
          console.error(`Could not authenticate:`);
          console.error(maybeError);
          return null;
        }
      }
    }),
  ],
  pages: customAuthPages,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  }
};

export default NextAuth(authOptions);
