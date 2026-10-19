import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  return (
    <section className="pt-10">
      <p className="text-sm font-semibold text-accent mb-3">같은 나라도, 사이마다 다르게</p>
      <h1 className="text-3xl font-bold leading-tight tracking-tight">
        가까운 사람일수록,<br />더 잘 이해할 방법이 필요합니다.
      </h1>
      <p className="mt-5 text-ink-2 leading-relaxed">
        엄마와 있을 때의 나, 친구와 있을 때의 나, 연인과 있을 때의 나, 동료와 있을 때의 나는 다릅니다.
        사이별은 내가 아는 사람과의 관계를 관계마다 다르게 읽어줍니다.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href={session?.user ? "/me" : "/login"} className="btn btn-primary">내 카드 만들기</Link>
        <Link href="#how" className="btn btn-ghost">어떻게 되나요?</Link>
      </div>

      <div id="how" className="mt-16 grid gap-4">
        {[
          ["1", "내 카드를 만들어요", "생년월일과 (알면) 출생시간을 넣으면 나의 결을 담은 카드가 생겨요. 입력한 정보는 누구에게도 보이지 않아요."],
          ["2", "가까운 사람을 초대해요", "이름과 관계(가족·친구·연인·직장동료)를 고르면 초대 링크가 생겨요. 상대가 직접 입력해야 결과가 열려요."],
          ["3", "사이를 읽어요", "두 사람 사이에 어떤 결이 맞고 어디서 부딪히는지, 그걸 어떻게 다루면 좋은지 관계마다 다르게 풀어줘요."],
        ].map(([n, t, d]) => (
          <div key={n} className="card p-5 flex gap-4">
            <div className="w-8 h-8 rounded-full bg-accent-soft text-accent font-bold flex items-center justify-center shrink-0">{n}</div>
            <div>
              <h3 className="font-semibold">{t}</h3>
              <p className="text-sm text-ink-2 mt-1 leading-relaxed">{d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
