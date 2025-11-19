import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// Store Firebase ID token in an HttpOnly cookie for middleware/server validation
const COOKIE_NAME = "fb_token";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) return new Response(null, { status: 204 });
  return new Response(null, { status: 401 });
}

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();
  if (!idToken || typeof idToken !== "string") {
    return new Response("Bad Request", { status: 400 });
  }
  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: idToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return new Response(null, { status: 204 });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return new Response(null, { status: 204 });
}


