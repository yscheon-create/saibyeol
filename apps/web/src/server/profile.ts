// 파생 프로파일 조회와 프로필 카드용 요약. SourceData는 읽지 않는다.
import type { DerivedProfile } from "@saibyeol/engine-saju";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { derivedProfiles, users } from "@/db/schema";
import { describeNature } from "./narrative/nature";

export async function getDerivedProfile(userId: string): Promise<DerivedProfile | null> {
  const row = await db.query.derivedProfiles.findFirst({ where: eq(derivedProfiles.userId, userId) });
  return row ? (row.data as DerivedProfile) : null;
}

export async function getDisplayName(userId: string): Promise<string> {
  const row = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { displayName: true, name: true, deletedAt: true },
  });
  if (!row || row.deletedAt) return "탈퇴한 사용자";
  return row.displayName ?? row.name ?? "이름 없음";
}

export async function setDisplayName(userId: string, displayName: string): Promise<void> {
  await db.update(users).set({ displayName }).where(eq(users.id, userId));
}

/** 프로필 카드에 쓰는 성향 요약. 원천정보나 명리 용어 없이 행동 문장만 쓴다. */
export interface ProfileCardSummary {
  /** 타고난 결 — 자연의 이미지로 쓴 한 문단 */
  nature: { image: string; season: string; text: string };
  lines: { label: string; text: string }[];
  hasBirthTime: boolean;
}

const pick = (v: number, high: string, low: string, mid: string, hi = 0.6, lo = 0.4) =>
  v >= hi ? high : v <= lo ? low : mid;

export function summarizeProfile(p: DerivedProfile): ProfileCardSummary {
  const c = p.traits.communication;
  const order = pick(c.order, "결론부터 말하는 편", "맥락을 먼저 깔고 말하는 편", "상황 따라 순서를 바꾸는 편");
  const speed = pick(c.speed, "떠오르는 대로 바로 말하는 편", "듣고 나서 천천히 답하는 편", "말과 침묵의 균형이 있는 편");
  const expression = pick(
    p.traits.emotional.expression,
    "감정이 빨리 올라오고 겉으로 보이는 편",
    "감정이 안에서 오래 머무는 편",
    "표현은 적지만 꾸준한 편",
    0.65, 0.35,
  );
  const drive = pick(p.traits.pace.drive, "결정도 수정도 빠른 편", "확인하고 움직이는 편", "상황을 보며 속도를 조절하는 편");
  return {
    nature: describeNature(p),
    hasBirthTime: p.hasBirthTime,
    lines: [
      { label: "대화의 결", text: `${order}이고, ${speed}이에요.` },
      { label: "감정의 온도", text: `${expression}이에요.` },
      { label: "생활의 속도", text: `${drive}이에요.` },
    ],
  };
}
