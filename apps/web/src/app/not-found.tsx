import Link from "next/link";

export default function NotFound() {
  return (
    <section className="pt-16 text-center">
      <h1 className="text-xl font-bold">찾을 수 없는 페이지예요</h1>
      <p className="text-sm text-ink-2 mt-2">주소가 바뀌었거나 링크가 잘못됐을 수 있어요.</p>
      <Link href="/" className="btn btn-ghost mt-8">사이별 첫 화면</Link>
    </section>
  );
}
