import { NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "jwt";

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/bills") ||
    pathname.startsWith("/transactions");
  const hasAuthCookie = Boolean(
    request.cookies.get(AUTH_COOKIE_NAME)?.value
  );

  if (isProtected && !hasAuthCookie) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/" && hasAuthCookie) {
    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/bills/:path*",
    "/transactions/:path*",
    "/",
  ],
};
