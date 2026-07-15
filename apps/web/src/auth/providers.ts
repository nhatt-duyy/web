// apps/web/src/auth/providers.ts
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';

export const providers = [
  Google,
  GitHub,
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(creds) {
      const res = await fetch(`${process.env.API_URL ?? 'http://localhost:3001'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });
      if (!res.ok) return null;
      const { access_token } = await res.json();
      return { id: creds.email as string, email: creds.email as string, accessToken: access_token };
    },
  }),
];