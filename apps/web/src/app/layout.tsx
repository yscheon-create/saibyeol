import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { auth } from "@/auth";
import { fixedBaseUrl } from "@/lib/base-url";

export const metadata: Metadata = {
  title: { default: "사이별 — 같은 나라도, 사이마다 다르게", template: "%s" },
  description: "내가 아는 사람과의 관계를, 관계마다 다르게 읽어주는 관계 이해 서비스",
  metadataBase: new URL(fixedBaseUrl() ?? "https://saibyeol.vercel.app"),
  openGraph: { siteName: "사이별", locale: "ko_KR", type: "website" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link rel="stylesheet" as="style" crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body className="min-h-full flex flex-col">
        <header className="px-5 py-4 flex items-center justify-between max-w-xl w-full mx-auto">
          <Link href="/" className="text-lg font-bold tracking-tight">사이별</Link>
          <nav className="flex items-center gap-4 text-sm text-ink-2">
            {session?.user ? (
              <>
                <Link href="/me" className="hover:text-ink">내 카드</Link>
                <Link href="/people" className="hover:text-ink">내 사이</Link>
              </>
            ) : (
              <Link href="/login" className="hover:text-ink">로그인</Link>
            )}
          </nav>
        </header>
        <main className="flex-1 px-5 pb-16 max-w-xl w-full mx-auto">{children}</main>
        <footer className="px-5 py-8 text-xs text-ink-3 max-w-xl w-full mx-auto">
          사이별 · 관계를 판단하거나 미래를 예측하지 않습니다.
        </footer>
      </body>
    </html>
  );
}
