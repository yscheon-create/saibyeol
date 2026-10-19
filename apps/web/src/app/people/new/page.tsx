import { redirect } from "next/navigation";
import { currentUserId } from "@/auth";
import { getDerivedProfile } from "@/server/profile";
import { RegisterForm } from "./RegisterForm";

export default async function NewPersonPage() {
  const userId = await currentUserId();
  if (!userId) redirect("/login?next=/people/new");
  if (!(await getDerivedProfile(userId))) redirect("/me");
  return (
    <section className="pt-8">
      <h1 className="text-2xl font-bold tracking-tight">가까운 사람 등록하기</h1>
      <p className="text-ink-2 text-sm mt-2 mb-8">상대의 생년월일은 묻지 않아요. 초대 링크를 보내면 상대가 직접 입력해요.</p>
      <RegisterForm />
    </section>
  );
}
