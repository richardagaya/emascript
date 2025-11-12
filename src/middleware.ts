import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Temporarily disabled middleware to debug startup issues
  return NextResponse.next();
}

export const config = {
  matcher: [],
};


