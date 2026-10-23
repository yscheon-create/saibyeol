"use client";
// 예상 못 한 오류가 나도 서비스 화면 안에서 안내한다. 사용자에게 기술적인 내용은 보이지 않는다.
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <section className="pt-16 text-center">
      <h1 className="text-xl font-bold">잠시 문제가 생겼어요</h1>
      <p className="text-sm text-ink-2 mt-2">다시 시도해도 같으면 링크를 보낸 분께 새 링크를 부탁해 보세요.</p>
      <div className="mt-8 flex gap-2 justify-center">
        <button onClick={reset} className="btn btn-primary">다시 시도</button>
        <Link href="/" className="btn btn-ghost">사이별 첫 화면</Link>
      </div>
      {error.digest && <p className="mt-6 text-xs text-ink-3">오류 코드 {error.digest}</p>}
    </section>
  );
}
