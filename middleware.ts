import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authMiddleware = withAuth({ pages: { signIn: "/login" } });

export default function middleware(
  req: NextRequest,
  event: Parameters<typeof authMiddleware>[1]
) {
  if (process.env.DISABLE_AUTH === "true") {
    return NextResponse.next();
  }
  return authMiddleware(req, event);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/update/:path*",
    "/snapshots/:path*",
    "/categories/:path*",
    "/settings/:path*",
    "/api/categories/:path*",
    "/api/line-items/:path*",
    "/api/snapshots/:path*",
    "/api/export/:path*",
    "/api/account/:path*",
  ],
};
