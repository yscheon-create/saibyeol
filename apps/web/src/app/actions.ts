"use server";
// 서버 액션. 모든 액션은 먼저 로그인 여부를 확인한다 (직접 POST로도 호출될 수 있으므로).
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUserId, signIn, signOut } from "@/auth";
import { activateEdge, createCandidate, revokeEdge, RELATIONSHIP_TYPES } from "@/server/edges";
import { setDisplayName } from "@/server/profile";
import { deleteOwnSourceData, saveOwnSourceData, sourceDataSchema } from "@/server/source-data";

export type ActionState = { error?: string } | undefined;

function parseSourceForm(formData: FormData) {
  const birthTimeKind = String(formData.get("birthTimeKind") ?? "unknown");
  const hour = String(formData.get("birthHour") ?? "");
  const minute = String(formData.get("birthMinute") ?? "00");
  const birthTime = birthTimeKind === "known" && hour !== "" ? `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}` : null;
  return sourceDataSchema.safeParse({
    birthDate: String(formData.get("birthDate") ?? ""),
    calendarType: String(formData.get("calendarType") ?? "solar"),
    isLeapMonth: formData.get("isLeapMonth") === "on",
    birthTime,
    gender: String(formData.get("gender") ?? ""),
  });
}

/** 기능 1: 내 정보 저장 → 프로필 카드 */
export async function saveMyInfo(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await currentUserId();
  if (!userId) redirect("/login?next=/me");
  const parsed = parseSourceForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력을 확인해 주세요" };
  const displayName = String(formData.get("displayName") ?? "").trim();
  if (displayName.length < 1 || displayName.length > 20) return { error: "이름(호칭)은 1~20자로 적어주세요" };
  try {
    await setDisplayName(userId, displayName);
    await saveOwnSourceData(userId, parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "저장 중 문제가 생겼어요" };
  }
  revalidatePath("/me");
  redirect("/me");
}

/** 기능 2(B쪽): 초대받은 사람이 본인 정보를 입력하고 관계를 활성화 */
export async function acceptInvite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  const userId = await currentUserId();
  if (!userId) redirect(`/login?next=/i/${encodeURIComponent(token)}`);
  const parsed = parseSourceForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력을 확인해 주세요" };
  const displayName = String(formData.get("displayName") ?? "").trim();
  if (displayName.length < 1 || displayName.length > 20) return { error: "이름(호칭)은 1~20자로 적어주세요" };
  let edgeId: string;
  try {
    await setDisplayName(userId, displayName);
    await saveOwnSourceData(userId, parsed.data);
    ({ edgeId } = await activateEdge(token, userId));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "처리 중 문제가 생겼어요" };
  }
  revalidatePath("/people");
  redirect(`/r/${edgeId}`);
}

/** 이미 내 카드가 있는 사람이 초대를 수락 */
export async function acceptInviteExisting(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const userId = await currentUserId();
  if (!userId) redirect(`/login?next=/i/${encodeURIComponent(token)}`);
  let edgeId: string;
  try {
    ({ edgeId } = await activateEdge(token, userId));
  } catch (e) {
    redirect(`/i/${encodeURIComponent(token)}?error=${encodeURIComponent(e instanceof Error ? e.message : "오류")}`);
  }
  revalidatePath("/people");
  redirect(`/r/${edgeId}`);
}

/** 기능 2(A쪽): 상대 등록 → 초대 링크 */
const registerSchema = z.object({
  counterpartLabel: z.string().trim().min(1, "상대를 부르는 이름을 적어주세요").max(20, "20자 이내로 적어주세요"),
  types: z.array(z.enum(RELATIONSHIP_TYPES as [string, ...string[]])).min(1, "관계 유형을 하나 이상 골라주세요"),
});

export async function registerCounterpart(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await currentUserId();
  if (!userId) redirect("/login?next=/people/new");
  const parsed = registerSchema.safeParse({
    counterpartLabel: formData.get("counterpartLabel"),
    types: formData.getAll("types").map(String),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  let edgeId: string;
  try {
    const edge = await createCandidate(userId, parsed.data.counterpartLabel, parsed.data.types as never);
    edgeId = edge.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "등록 중 문제가 생겼어요" };
  }
  revalidatePath("/people");
  redirect(`/r/${edgeId}`);
}

export async function revokeRelationship(formData: FormData): Promise<void> {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  const edgeId = String(formData.get("edgeId") ?? "");
  await revokeEdge(edgeId, userId);
  revalidatePath("/people");
  redirect("/people");
}

export async function deleteMyInfo(): Promise<void> {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  await deleteOwnSourceData(userId);
  revalidatePath("/me");
  revalidatePath("/people");
  redirect("/me");
}

export async function signInWithKakao(formData: FormData): Promise<void> {
  const next = String(formData.get("next") ?? "/me");
  await signIn("kakao", { redirectTo: next.startsWith("/") ? next : "/me" });
}

export async function signInDev(formData: FormData): Promise<void> {
  const next = String(formData.get("next") ?? "/me");
  await signIn("dev", { handle: String(formData.get("handle") ?? ""), redirectTo: next.startsWith("/") ? next : "/me" });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
