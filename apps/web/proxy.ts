import { NextResponse, type NextRequest } from "next/server";

import {
  isLocale,
  LOCALE_COOKIE,
  localeCookieOptions,
  resolveLocaleFromHeader,
} from "@/lib/i18n/config";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const current = request.cookies.get(LOCALE_COOKIE)?.value;

  if (!isLocale(current)) {
    const locale = resolveLocaleFromHeader(
      request.headers.get("accept-language"),
    );
    response.cookies.set(LOCALE_COOKIE, locale, localeCookieOptions());
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
