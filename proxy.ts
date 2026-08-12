import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminPath, isAdminPath } from "@/lib/admin-path";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminPath = getAdminPath();

  if (adminPath) {
    const prefix = `/${adminPath}`;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const internal = pathname === prefix ? "/" : pathname.slice(prefix.length);
      const url = request.nextUrl.clone();
      url.pathname = internal;
      const response = NextResponse.rewrite(url);
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return response;
    }

    if (isAdminPath(pathname)) {
      return new NextResponse(null, { status: 404 });
    }
  } else if (isAdminPath(pathname)) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/|uploads/|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|webp|avif|svg|gif|ico|css|js|mjs|json|woff|woff2|ttf|otf|eot)).*)",
  ],
};
