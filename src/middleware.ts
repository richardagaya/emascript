import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware removed - auth checking now handled client-side in Dashboard page
// This prevents race conditions where middleware redirects before client can refresh session

export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};

