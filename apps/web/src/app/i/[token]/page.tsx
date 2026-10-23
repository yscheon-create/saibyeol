import type { Metadata } from "next";
import Link from "next/link";
import { currentUserId } from "@/auth";
import { inviteMessage } from "@/lib/base-url";
import { acceptInvite, acceptInviteExisting } from "@/app/actions";
import { SourceDataForm } from "@/components/SourceDataForm";
import { getInvitePreview, RELATIONSHIP_TYPE_LABEL } from "@/server/edges";
import { getDerivedProfile, getDisplayName } from "@/server/profile";

/** 카카오톡 등 메신저의 링크 미리보기에 쓰이는 제목·설명. 원천정보는 없다. */
export async function generateMetadata(props: PageProps<"/i/[token]">): Promise<Metadata> {
  const { token } = await props.params;
  const preview = await getInvitePreview(token).catch(() => null);
  if (!preview || preview.state !== "candidate" || preview.expired) {
    return { title: "사이별 초대장", description: "같은 나라도, 사이마다 다르게." };
  }
  const title = `${preview.inviterName}님의 초대장 — 사이별`;
  const description = inviteMessage(preview.inviterName);
  return {
    title, description,
    openGraph: { title, description, siteName: "사이별", type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function InvitePage(props: PageProps<"/i/[token]">) {
  const { token } = await props.params;
  const sp = await props.searchParams;
  const preview = await getInvitePreview(token);
  if (!preview) return <Empty title="초대 링크를 찾을 수 없어요" />;
  if (preview.state === "revoked") return <Empty title="닫힌 초대예요" />;
  if (preview.expired && preview.state === "candidate") return <Empty title="초대 링크가 만료됐어요" desc={`${preview.inviterName}님께 새 링크를 부탁해 보세요.`} />;

  const userId = await currentUserId();
  const typesText = preview.types.map((t) => RELATIONSHIP_TYPE_LABEL[t]).join("·");

  const header = (
    <>
      <p className="text-xs font-semibold text-accent">초대장</p>
      <h1 className="text-2xl font-bold tracking-tight mt-1 leading-snug">
        {preview.inviterName}님이<br />당신의 결을 더 알고 싶어 해요
      </h1>
      <p className="mt-3 leading-relaxed">
        정보를 입력하고 {preview.inviterName}님의 결도 함께 알아보세요.
      </p>
      <p className="text-ink-2 text-sm mt-3 leading-relaxed">
        {preview.inviterName}님은 당신을 <b>{preview.counterpartLabel}</b>({typesText})으로 등록했어요.
        당신이 직접 입력한 뒤에야 두 사람의 사이가 열리고, 결과는 두 분 모두에게 똑같이 보여요.
      </p>
      <ul className="mt-4 text-xs text-ink-3 grid gap-1">
        <li>· 입력하는 것: 이름, 생년월일, (알면) 출생시간, 성별</li>
        <li>· 상대에게 보이는 것: 거기서 읽어낸 성향과 두 사람 사이의 해석</li>
        <li>· 보이지 않는 것: 생년월일과 출생시간 그 자체</li>
      </ul>
    </>
  );

  if (!userId) {
    return (
      <section className="pt-8">
        {header}
        <Link href={`/login?next=/i/${encodeURIComponent(token)}`} className="btn btn-primary mt-8 w-full">시작하기</Link>
      </section>
    );
  }

  const [profile, name] = await Promise.all([getDerivedProfile(userId), getDisplayName(userId)]);
  const error = typeof sp.error === "string" ? sp.error : null;

  return (
    <section className="pt-8">
      {header}
      {error && <p className="mt-4 text-sm text-warm">{error}</p>}
      <div className="mt-8">
        {profile ? (
          <form action={acceptInviteExisting} className="card p-5 grid gap-3">
            <input type="hidden" name="token" value={token} />
            <p className="text-sm">이미 내 카드가 있어요. <b>{name}</b>(으)로 이 초대를 수락할까요?</p>
            <button className="btn btn-primary">수락하고 사이 읽기</button>
          </form>
        ) : (
          <SourceDataForm action={acceptInvite} hidden={{ token }} initialDisplayName={name === "이름 없음" ? "" : name} submitLabel="입력하고 사이 읽기" />
        )}
      </div>
    </section>
  );
}

function Empty({ title, desc }: { title: string; desc?: string }) {
  return (
    <section className="pt-16 text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      {desc && <p className="text-sm text-ink-2 mt-2">{desc}</p>}
      <Link href="/" className="btn btn-ghost mt-8">사이별 알아보기</Link>
    </section>
  );
}
