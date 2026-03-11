import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_ENTRY_COOKIE_NAME } from "@/lib/auth-entry/constants";

export function middleware(request: NextRequest) {
  const hasAuthEntrySession = Boolean(
    request.cookies.get(AUTH_ENTRY_COOKIE_NAME)?.value,
  );

  if (!hasAuthEntrySession && request.nextUrl.pathname === "/recruit/new") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", "/recruit/new");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/recruit/new"],
};
