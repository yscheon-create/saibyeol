import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { currentUserId } from "@/auth";
import { revokeRelationship } from "@/app/actions";
import { CopyLink } from "@/components/CopyLink";
import { getEdgeResult, RELATIONSHIP_TYPE_LABEL } from "@/server/edges";
import { FOOTER } from "@/server/narrative/templates";
import type { RelationshipType } from "@saibyeol/engine-saju";

export default async function ResultPage(props: PageProps<"/r/[edgeId]">) {
  const { edgeId } = await props.params;
  const sp = await props.searchParams;
  const userId = await currentUserId();
  if (!userId) redirect(`/login?next=/r/${edgeId}`);
  const view = await getEdgeResult(edgeId, userId);
  if (!view) notFound();

  const me = view.iAmA ? view.labelA : view.labelB;
  const other = view.iAmA ? view.labelB : view.labelA;

  // ─── 초대 대기 (A만 볼 수 있음) ───
  if (view.state === "candidate") {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    const url = `${proto}://${host}/i/${view.inviteToken}`;
    return (
      <section className="pt-8">
        <p className="text-xs font-semibold text-mid">초대 대기</p>
        <h1 className="text-2xl font-bold tracking-tight mt-1">{other}에게 링크를 보내주세요</h1>
        <p className="text-ink-2 text-sm mt-3 leading-relaxed">
          {other}이(가) 링크를 열어 본인 정보를 직접 입력하면 두 사람의 사이가 열려요. 링크는 14일 동안 유효해요.
        </p>
        <div className="card p-5 mt-6"><CopyLink url={url} /></div>
        <p className="text-xs text-ink-3 mt-4">관계: {view.types.map((t) => RELATIONSHIP_TYPE_LABEL[t]).join(" · ")}</p>
        <form action={revokeRelationship} className="mt-10">
          <input type="hidden" name="edgeId" value={view.edgeId} />
          <button className="text-sm text-ink-3 hover:text-warm">이 초대 취소하기</button>
        </form>
      </section>
    );
  }

  if (view.state === "revoked") {
    return (
      <section className="pt-16 text-center">
        <h1 className="text-xl font-bold">닫힌 사이예요</h1>
        <p className="text-sm text-ink-2 mt-2">한 분이 관계를 닫았거나 정보를 삭제했어요.</p>
        <Link href="/people" className="btn btn-ghost mt-8">내 사이로</Link>
      </section>
    );
  }

  // ─── 활성: 유형 탭 + 해설 ───
  const requested = typeof sp.type === "string" ? (sp.type as RelationshipType) : null;
  const type = requested && view.types.includes(requested) ? requested : view.types[0]!;
  const n = view.results[type];
  if (!n) notFound();

  return (
    <section className="pt-8">
      <p className="text-xs font-semibold text-accent">{me} ↔ {other}</p>
      <h1 className="text-2xl font-bold tracking-tight mt-1 leading-snug">{n.headline}</h1>

      {view.types.length > 1 && (
        <div className="flex gap-2 mt-5">
          {view.types.map((t) => (
            <Link key={t} href={`/r/${view.edgeId}?type=${t}`}
              className={`chip ${t === type ? "bg-ink text-white" : "bg-paper-2 text-ink-2"}`}>
              {RELATIONSHIP_TYPE_LABEL[t]}로 보기
            </Link>
          ))}
        </div>
      )}
      {view.types.length === 1 && <p className="text-sm text-ink-3 mt-3">{RELATIONSHIP_TYPE_LABEL[type]} 사이로 읽었어요</p>}

      <div className="card p-5 mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-ink-3 font-semibold">가장 잘 맞는 결</p>
          <p className="font-semibold mt-1 text-good">{n.shareableExcerpt.best.label}</p>
        </div>
        <div>
          <p className="text-xs text-ink-3 font-semibold">가장 부딪히는 결</p>
          <p className="font-semibold mt-1 text-warm">{n.shareableExcerpt.friction.label}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {n.sections.map((s) => (
          <article key={s.dimension} className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{s.label}</h2>
              <span className={`chip chip-${s.level}`}>{s.levelLabel}</span>
            </div>
            <p className="mt-4 leading-relaxed">{s.observation}</p>
            <p className="mt-2 leading-relaxed text-ink-2">{s.interplay}</p>
            <p className="mt-4 leading-relaxed border-l-2 border-accent pl-3">{s.howTo}</p>
          </article>
        ))}
      </div>

      {n.confidenceNote && <p className="mt-6 text-sm text-ink-2">{n.confidenceNote}</p>}
      <p className="mt-8 text-xs text-ink-3 leading-relaxed">{FOOTER}</p>
      <p className="mt-1 text-xs text-ink-3">해석 엔진: 타고난 결 v{n.templateVersion}</p>

      <div className="mt-10 flex items-center gap-4">
        <Link href="/people" className="btn btn-ghost">내 사이로</Link>
        <form action={revokeRelationship} className="ml-auto">
          <input type="hidden" name="edgeId" value={view.edgeId} />
          <button className="text-sm text-ink-3 hover:text-warm">이 사이 닫기</button>
        </form>
      </div>
    </section>
  );
}
