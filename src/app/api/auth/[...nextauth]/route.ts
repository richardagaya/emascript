import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

// Firebase REST API endpoints and expected env vars
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY as string | undefined;

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials ?? {});
        if (!parsed.success) return null;

        if (!FIREBASE_API_KEY) {
          console.error("Missing FIREBASE_API_KEY env var");
          return null;
        }

        const { email, password } = parsed.data;

        try {
          const resp = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password, returnSecureToken: true }),
            }
          );

          if (!resp.ok) {
            return null;
          }

          const data: {
            localId: string;
            email: string;
            idToken: string;
            refreshToken: string;
            displayName?: string;
            expiresIn: string; // seconds
          } = await resp.json();

          return {
            id: data.localId,
            email: data.email,
            name: data.displayName ?? null,
            firebaseIdToken: data.idToken,
            firebaseRefreshToken: data.refreshToken,
            firebaseTokenExpiresInSeconds: Number(data.expiresIn),
          };
        } catch (e) {
          console.error("Firebase signInWithPassword failed", e);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Initial sign in, persist Firebase identity
        const u = user as unknown as {
          id?: string;
          firebaseIdToken?: string;
          firebaseRefreshToken?: string;
          firebaseTokenExpiresInSeconds?: number;
        };
        token.uid = u.id;
        token.firebaseIdToken = u.firebaseIdToken;
        token.firebaseRefreshToken = u.firebaseRefreshToken;
        if (u.firebaseTokenExpiresInSeconds) {
          token.firebaseIdTokenExpiresAt = Date.now() + u.firebaseTokenExpiresInSeconds * 1000;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // surface uid and idToken on session for client use
      interface ExtendedUser {
        uid?: string;
      }
      interface ExtendedSession {
        firebaseIdToken?: string;
      }
      interface ExtendedToken {
        uid?: string;
        firebaseIdToken?: string;
      }
      (session.user as ExtendedUser).uid = (token as ExtendedToken).uid;
      (session as ExtendedSession).firebaseIdToken = (token as ExtendedToken).firebaseIdToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


