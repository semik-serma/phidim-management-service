import { NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "jwt";

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/bills") ||
    pathname.startsWith("/transactions") ||
    pathname.startsWith("/notes") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/users");

  const hasAuthCookie = Boolean(
    request.cookies.get(AUTH_COOKIE_NAME)?.value
  );

  // If user tries to visit disabled register page, redirect to home
  if (pathname.startsWith("/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect unauthenticated visitors attempting to view protected pages
  if (isProtected && !hasAuthCookie) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated visitors away from root login
  if (pathname === "/" && hasAuthCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/bills/:path*",
    "/transactions/:path*",
    "/notes/:path*",
    "/products/:path*",
    "/users/:path*",
    "/register/:path*",
    "/",
  ],
};
