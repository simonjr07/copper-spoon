import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authenticateCredentials } from "@/server/auth/credentials";
import { credentialRepository } from "@/server/auth/user-repository";

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  providers: [
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
          autocomplete: "email",
        },
        password: {
          label: "Password",
          type: "password",
          autocomplete: "current-password",
        },
      },
      authorize(credentials) {
        return authenticateCredentials(credentials, credentialRepository);
      },
    }),
  ],
  callbacks: {
    authorized({ auth: session, request }) {
      const pathname = request.nextUrl.pathname;
      const isLogin = pathname === "/admin/login";
      const isProtectedAdminRoute =
        pathname === "/admin" ||
        (pathname.startsWith("/admin/") && !isLogin);

      return !isProtectedAdminRoute || Boolean(session?.user?.id);
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.status = user.status;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.status = token.status;
      }

      return session;
    },
  },
});
