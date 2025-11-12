import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Health check endpoint - verifies the app is ready and responding
    // This endpoint is used by Firebase App Hosting to verify the app is ready
    return NextResponse.json(
      { 
        status: "ok", 
        timestamp: new Date().toISOString(),
        version: "1.0.2"
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Health check failed" },
      { status: 500 }
    );
  }
}

