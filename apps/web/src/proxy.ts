// 로그인 필요한 경로 1차 차단. 최종 확인은 각 페이지·서버 액션에서 다시 한다.
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";

const PROTECTED = [/^\/me(\/|$)/, /^\/people(\/|$)/, /^\/r(\/|$)/];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!PROTECTED.some((re) => re.test(pathname))) return NextResponse.next();
  const session = await auth();
  if (session?.user?.id) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
