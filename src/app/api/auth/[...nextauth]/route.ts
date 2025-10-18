import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
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

        const { email, password } = parsed.data;

        // Demo user. Replace with real user lookup and password check.
        const demoUser = {
          id: "1",
          email: "demo@example.com",
          name: "Demo User",
          // NOT USED: add password hashing in a real app
          password: "password123",
        } as const;

        if (email === demoUser.email && password === demoUser.password) {
          return { id: demoUser.id, email: demoUser.email, name: demoUser.name };
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  pages: { signIn: "/login" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


