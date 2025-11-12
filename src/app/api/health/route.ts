import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Basic health check - just return OK
    // This endpoint is used by Firebase App Hosting to verify the app is ready
    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Health check failed" },
      { status: 500 }
    );
  }
}

