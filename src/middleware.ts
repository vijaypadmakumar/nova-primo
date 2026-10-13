import { NextResponse, type NextRequest } from "next/server";

// Cheap first check only: is there a session cookie at all? Pages still check
// that the session is real (see requireOffice) before showing any data.
export function middleware(request: NextRequest) {
  if (!request.cookies.has("nova_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|onboarding|_next|icon.svg|favicon.ico|manifest.webmanifest).*)"],
};
