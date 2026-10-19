import { DEV_LOGIN_ENABLED } from "@/auth";
import { signInDev, signInWithKakao } from "@/app/actions";

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : "/me";
  return (
    <section className="pt-12 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">시작하기</h1>
      <p className="text-ink-2 mt-2 text-sm">카카오 계정으로 간단히 시작해요.</p>

      <form action={signInWithKakao} className="mt-8">
        <input type="hidden" name="next" value={next} />
        <button type="submit" className="btn btn-kakao w-full">카카오로 시작하기</button>
      </form>

      {DEV_LOGIN_ENABLED && (
        <form action={signInDev} className="mt-10 card p-4 grid gap-2">
          <p className="text-xs font-semibold text-ink-3">개발용 로그인 (배포 환경에서는 보이지 않아요)</p>
          <input type="hidden" name="next" value={next} />
          <input name="handle" className="field" placeholder="아무 이름 (예: jieun)" required pattern="[a-zA-Z0-9가-힣_-]{1,20}" />
          <button type="submit" className="btn btn-ghost">이 이름으로 들어가기</button>
        </form>
      )}
    </section>
  );
}
