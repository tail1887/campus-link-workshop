import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "campus-link.session";

export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!hasSession && request.nextUrl.pathname === "/recruit/new") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", "/recruit/new");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/recruit/new"],
};
