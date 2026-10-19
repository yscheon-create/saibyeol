import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserId } from "@/auth";
import { deleteMyInfo, saveMyInfo, signOutAction } from "@/app/actions";
import { ProfileCard } from "@/components/ProfileCard";
import { SourceDataForm } from "@/components/SourceDataForm";
import { getDerivedProfile, getDisplayName, summarizeProfile } from "@/server/profile";
import { getOwnSourceData } from "@/server/source-data";

export default async function MePage(props: PageProps<"/me">) {
  const userId = await currentUserId();
  if (!userId) redirect("/login?next=/me");
  const sp = await props.searchParams;
  const editing = sp.edit === "1";

  const [profile, name, own] = await Promise.all([
    getDerivedProfile(userId), getDisplayName(userId), getOwnSourceData(userId),
  ]);

  if (!profile || editing) {
    return (
      <section className="pt-8">
        <h1 className="text-2xl font-bold tracking-tight">{profile ? "내 정보 고치기" : "내 카드 만들기"}</h1>
        <p className="text-ink-2 text-sm mt-2 mb-8">입력한 정보는 나만 볼 수 있어요.</p>
        <SourceDataForm action={saveMyInfo} initial={own} initialDisplayName={name === "이름 없음" ? "" : name}
          submitLabel={profile ? "저장하기" : "카드 만들기"} />
        {profile && <Link href="/me" className="block mt-6 text-sm text-ink-3">취소</Link>}
      </section>
    );
  }

  return (
    <section className="pt-8 grid gap-6">
      <ProfileCard name={name} summary={summarizeProfile(profile)} />
      <div className="card p-5">
        <h3 className="font-semibold">가까운 사람과의 사이를 읽어볼까요?</h3>
        <p className="text-sm text-ink-2 mt-1">가족·친구·연인·직장동료를 초대하면, 상대가 직접 입력한 뒤 두 사람의 사이가 열려요.</p>
        <div className="mt-4 flex gap-2">
          <Link href="/people/new" className="btn btn-primary">가까운 사람 등록하기</Link>
          <Link href="/people" className="btn btn-ghost">내 사이 보기</Link>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm text-ink-3">
        <Link href="/me?edit=1" className="hover:text-ink">내 정보 고치기</Link>
        <form action={deleteMyInfo}><button className="hover:text-warm">내 정보 삭제</button></form>
        <form action={signOutAction} className="ml-auto"><button className="hover:text-ink">로그아웃</button></form>
      </div>
    </section>
  );
}
