// apps/web/src/auth.ts
import NextAuth from 'next-auth';
import { providers } from './auth/providers';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.provider === 'credentials' && user) {
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
  },
});