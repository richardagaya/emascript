import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    firebaseIdToken?: string;
    user: DefaultSession["user"] & {
      uid?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    firebaseIdToken?: string;
    firebaseRefreshToken?: string;
    firebaseIdTokenExpiresAt?: number;
  }
}


