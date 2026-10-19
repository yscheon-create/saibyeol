// 로그인 설정 (Auth.js v5). 카카오가 유일한 실제 로그인이다.
// 개발용 로그인은 NODE_ENV가 production이 아니고 DEV_LOGIN=1일 때만 켜진다. 배포 환경에서는 어떤 값이어도 켜지지 않는다.
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Kakao from "next-auth/providers/kakao";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";

declare module "next-auth" {
  interface Session {
    user: { id: string; displayName: string | null } & DefaultSession["user"];
  }
}

export const DEV_LOGIN_ENABLED = process.env.NODE_ENV !== "production" && process.env.DEV_LOGIN === "1";

/** 개발용 로그인: 아무 식별자로 들어오면 그 식별자에 묶인 사용자를 만들거나 찾는다. */
async function devUser(handle: string) {
  const email = `${handle}@dev.saibyeol.local`;
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) return existing;
  const [created] = await db
    .insert(users)
    .values({ email, name: handle, displayName: handle })
    .returning();
  return created ?? null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // Credentials(개발용 로그인)를 함께 쓰려면 세션은 JWT여야 한다.
  session: { strategy: "jwt" },
  providers: [
    Kakao,
    ...(DEV_LOGIN_ENABLED
      ? [
          Credentials({
            id: "dev",
            name: "개발용 로그인",
            credentials: { handle: { label: "이름", type: "text" } },
            async authorize(credentials) {
              const handle = String(credentials?.handle ?? "").trim();
              if (!/^[a-zA-Z0-9가-힣_-]{1,20}$/.test(handle)) return null;
              const u = await devUser(handle);
              return u ? { id: u.id, name: u.name, email: u.email } : null;
            },
          }),
        ]
      : []),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
        const row = await db.query.users.findFirst({
          where: eq(users.id, token.sub),
          columns: { displayName: true, name: true, deletedAt: true },
        });
        session.user.displayName = row?.displayName ?? row?.name ?? null;
      }
      return session;
    },
  },
  events: {
    // 카카오로 처음 가입하면 닉네임을 호칭 기본값으로 복사한다
    async createUser({ user }) {
      if (user.id && user.name) {
        await db.update(users).set({ displayName: user.name }).where(eq(users.id, user.id));
      }
    },
  },
});

/** 로그인한 사용자 id. 없으면 null. 서버 컴포넌트·서버 액션에서 쓴다. */
export async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
