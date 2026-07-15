// apps/web/src/auth.ts
import NextAuth from 'next-auth';
import { providers } from './auth/providers';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.provider === 'credentials' && user) {
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      // Copy backend JWT (từ credentials login) sang object session trả về client,
      // để api-client.ts có thể đọc session.accessToken gắn vào header Authorization.
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
  },
});