import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";

const publicPaths = ["/", "/sign-in", "/sign-up"];

function isPublic(path) {
  return publicPaths.find((x) => 
    path.startsWith(x)
  );
}

export default clerkMiddleware((auth, req) => {
  if (isPublic(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // If the user is not signed in and the route is private, redirect them to sign in
  if (!auth.userId && !isPublic(req.nextUrl.pathname)) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Allow users to access onboarding
  if (req.nextUrl.pathname === "/onboarding") {
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!.*\\.).*)", // match all files except those with file extensions
    "/",              // match root exactly
  ],
};