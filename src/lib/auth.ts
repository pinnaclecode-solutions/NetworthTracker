import { NextAuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

// ── Dev bypass ────────────────────────────────────────────────────────────────
// When DISABLE_AUTH=true, skip Google OAuth and use a local dev user.
// The dev user is upserted on first call so all DB queries work normally.

let _devUser: { id: string; name: string | null; email: string | null; image: string | null } | null = null;

async function getDevSession(): Promise<Session> {
  if (!_devUser) {
    _devUser = await prisma.user.upsert({
      where: { email: "dev@localhost" },
      update: {},
      create: {
        name: "Dev User",
        email: "dev@localhost",
        emailVerified: new Date(),
      },
      select: { id: true, name: true, email: true, image: true },
    });
  }
  return {
    user: {
      id: _devUser.id,
      name: _devUser.name,
      email: _devUser.email,
      image: _devUser.image,
    },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  };
}

/**
 * Drop-in replacement for getServerSession(authOptions).
 * Returns a real dev session (backed by a DB user) when DISABLE_AUTH=true.
 */
export async function getSession(): Promise<Session | null> {
  if (process.env.DISABLE_AUTH === "true") {
    return getDevSession();
  }
  return getServerSession(authOptions);
}
