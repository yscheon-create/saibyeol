import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserId } from "@/auth";
import { listEdgesFor, RELATIONSHIP_TYPE_LABEL } from "@/server/edges";
import { getDerivedProfile } from "@/server/profile";

const STATE_LABEL = { candidate: "초대 대기", active: "열림", revoked: "닫힘" } as const;

export default async function PeoplePage() {
  const userId = await currentUserId();
  if (!userId) redirect("/login?next=/people");
  const profile = await getDerivedProfile(userId);
  if (!profile) redirect("/me");
  const items = await listEdgesFor(userId);

  return (
    <section className="pt-8">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-bold tracking-tight">내 사이</h1>
        <Link href="/people/new" className="btn btn-primary">등록하기</Link>
      </div>
      {items.length === 0 ? (
        <div className="card p-6 mt-6 text-sm text-ink-2">
          아직 등록한 사람이 없어요. 가장 가까운 한 사람부터 시작해 보세요.
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {items.map((it) => (
            <li key={it.id}>
              <Link href={`/r/${it.id}`} className="card p-5 block hover:bg-paper-2/40">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{it.counterpartName}</span>
                  <span className={`text-xs font-semibold ${it.state === "active" ? "text-good" : it.state === "candidate" ? "text-mid" : "text-ink-3"}`}>
                    {STATE_LABEL[it.state]}
                  </span>
                </div>
                <div className="mt-1 text-xs text-ink-3">{it.types.map((t) => RELATIONSHIP_TYPE_LABEL[t]).join(" · ")}</div>
                {it.headline && <p className="mt-3 text-sm text-ink-2">{it.headline}</p>}
                {it.state === "candidate" && <p className="mt-3 text-sm text-ink-2">상대가 아직 입력하지 않았어요. 초대 링크를 다시 보내볼까요?</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
