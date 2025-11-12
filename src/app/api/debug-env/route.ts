import { NextResponse } from "next/server";

export async function GET() {
  try {
    const envCheck = {
      FIREBASE_ADMIN_PROJECT_ID: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
      FIREBASE_ADMIN_CLIENT_EMAIL: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      FIREBASE_ADMIN_PRIVATE_KEY_SET: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      FIREBASE_ADMIN_PRIVATE_KEY_LENGTH: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0,
      FIREBASE_ADMIN_PRIVATE_KEY_STARTS_WITH: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.substring(0, 50) || "NOT_SET",
      NEXT_PUBLIC_FIREBASE_API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    };

    return NextResponse.json(envCheck, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check environment variables", details: String(error) },
      { status: 500 }
    );
  }
}

