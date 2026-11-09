import { NextResponse, type NextRequest } from "next/server";

// The bare address picks a language: Mongolian for a browser that asks for
// it first, English for everyone else. Both pages are static; this only
// redirects.
export function proxy(request: NextRequest) {
  const accept = request.headers.get("accept-language") ?? "";
  const first = accept.split(",")[0]?.trim().toLowerCase() ?? "";
  const lang = first.startsWith("mn") ? "mn" : "en";
  const url = request.nextUrl.clone();
  url.pathname = `/${lang}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: "/",
};
