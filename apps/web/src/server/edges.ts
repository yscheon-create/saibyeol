// 관계(Edge) 생성·활성화·철회·조회. 상태 전이는 activateEdge / revokeEdge 에서만 일어난다 (CLAUDE.md 3절).
// 이 파일은 SourceData를 읽지 않는다. 엔진 입력은 DerivedProfile뿐이다.
import { compare, type DerivedProfile, type RelationshipType } from "@saibyeol/engine-saju";
import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db, type Db } from "@/db";
import { compatibilityVectors, narratives, relationshipEdges, users } from "@/db/schema";
import { getDerivedProfile, getDisplayName } from "./profile";
import { renderNarrative, type RenderedNarrative } from "./narrative/render";

export const RELATIONSHIP_TYPE_LABEL: Record<RelationshipType, string> = {
  family: "가족",
  friend: "친구",
  romance: "연인",
  coworker: "직장동료",
};
export const RELATIONSHIP_TYPES = Object.keys(RELATIONSHIP_TYPE_LABEL) as RelationshipType[];

const INVITE_TTL_DAYS = 14;
type Tx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

/** 초대 토큰: 128비트 난수, URL 안전 문자 */
function newInviteToken(): string {
  return randomBytes(16).toString("base64url");
}

// ───────────────────────── 생성 ─────────────────────────

/** A가 상대를 등록한다. 상대는 아직 없고, 호칭과 유형만 있다. 상태는 candidate. */
export async function createCandidate(userAId: string, counterpartLabel: string, types: RelationshipType[]) {
  const label = counterpartLabel.trim();
  if (label.length < 1 || label.length > 20) throw new Error("호칭은 1~20자여야 해요");
  const uniqueTypes = [...new Set(types)].filter((t) => RELATIONSHIP_TYPES.includes(t));
  if (uniqueTypes.length === 0) throw new Error("관계 유형을 하나 이상 골라주세요");

  const [edge] = await db
    .insert(relationshipEdges)
    .values({
      userAId,
      counterpartLabel: label,
      types: uniqueTypes,
      inviteToken: newInviteToken(),
      inviteExpiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86400_000),
    })
    .returning();
  return edge!;
}

// ───────────────────────── 초대 링크 ─────────────────────────

export interface InvitePreview {
  edgeId: string;
  inviterName: string;
  counterpartLabel: string;
  types: RelationshipType[];
  state: "candidate" | "active" | "revoked";
  expired: boolean;
}

/** 초대 링크를 연 사람(로그인 전일 수 있음)에게 보여줄 정보. 원천정보는 없다. */
export async function getInvitePreview(token: string): Promise<InvitePreview | null> {
  const edge = await db.query.relationshipEdges.findFirst({ where: eq(relationshipEdges.inviteToken, token) });
  if (!edge) return null;
  return {
    edgeId: edge.id,
    inviterName: await getDisplayName(edge.userAId),
    counterpartLabel: edge.counterpartLabel,
    types: edge.types,
    state: edge.state,
    expired: edge.inviteExpiresAt.getTime() < Date.now(),
  };
}

// ───────────────────────── 상태 전이 ─────────────────────────

/**
 * B가 본인 원천정보를 입력한 뒤 호출된다. candidate → active.
 * 조건: 토큰 유효, 만료 전, B ≠ A, B의 DerivedProfile 존재. 만족하면 B를 묶고 네 유형의 결과를 계산한다.
 */
export async function activateEdge(token: string, userBId: string): Promise<{ edgeId: string }> {
  const edge = await db.query.relationshipEdges.findFirst({ where: eq(relationshipEdges.inviteToken, token) });
  if (!edge) throw new Error("초대 링크를 찾을 수 없어요");
  if (edge.state === "active") {
    if (edge.userBId === userBId || edge.userAId === userBId) return { edgeId: edge.id };
    throw new Error("이미 다른 분이 수락한 초대예요");
  }
  if (edge.state !== "candidate") throw new Error("더 이상 유효하지 않은 초대예요");
  if (edge.inviteExpiresAt.getTime() < Date.now()) throw new Error("초대 링크가 만료됐어요");
  if (edge.userAId === userBId) throw new Error("자기 자신을 초대할 수는 없어요");

  const profileB = await getDerivedProfile(userBId);
  if (!profileB) throw new Error("먼저 본인 정보를 입력해 주세요");
  const profileA = await getDerivedProfile(edge.userAId);
  if (!profileA) throw new Error("초대한 분의 정보가 아직 없어요");

  await db.transaction(async (tx) => {
    await tx
      .update(relationshipEdges)
      .set({ userBId, state: "active", activatedAt: new Date() })
      .where(and(eq(relationshipEdges.id, edge.id), eq(relationshipEdges.state, "candidate")));
    await computeResults(tx, edge.id, edge.types, profileA, profileB, await getDisplayName(edge.userAId), edge.counterpartLabel);
  });
  return { edgeId: edge.id };
}

/** active → revoked. 되돌릴 수 없다. 결과(Vector·Narrative)는 삭제한다. */
export async function revokeEdge(edgeId: string, byUserId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const edge = await tx.query.relationshipEdges.findFirst({ where: eq(relationshipEdges.id, edgeId) });
    if (!edge || (edge.userAId !== byUserId && edge.userBId !== byUserId)) throw new Error("권한이 없어요");
    await revokeRows(tx, [edgeId], byUserId);
  });
}

/** 사용자의 모든 Edge 철회. 원천정보 삭제 연쇄에서 호출된다. */
export async function revokeAllEdgesOf(tx: Tx, userId: string): Promise<void> {
  const rows = await tx
    .select({ id: relationshipEdges.id })
    .from(relationshipEdges)
    .where(and(or(eq(relationshipEdges.userAId, userId), eq(relationshipEdges.userBId, userId)), inArray(relationshipEdges.state, ["candidate", "active"])));
  if (rows.length) await revokeRows(tx, rows.map((r) => r.id), userId);
}

async function revokeRows(tx: Tx, edgeIds: string[], byUserId: string) {
  await tx.delete(compatibilityVectors).where(inArray(compatibilityVectors.edgeId, edgeIds));
  await tx.delete(narratives).where(inArray(narratives.edgeId, edgeIds));
  await tx
    .update(relationshipEdges)
    .set({ state: "revoked", revokedAt: new Date(), revokedBy: byUserId })
    .where(inArray(relationshipEdges.id, edgeIds));
}

// ───────────────────────── 결과 계산 ─────────────────────────

async function computeResults(
  tx: Tx, edgeId: string, types: RelationshipType[],
  profileA: DerivedProfile, profileB: DerivedProfile, labelA: string, labelB: string,
) {
  const missing = { a: !profileA.hasBirthTime, b: !profileB.hasBirthTime };
  for (const type of types) {
    const vector = compare(profileA, profileB, type);
    const narrative = renderNarrative(vector, labelA, labelB, `${edgeId}:${type}`, missing);
    await tx
      .insert(compatibilityVectors)
      .values({
        edgeId, relationshipType: type, dimensions: vector.dimensions, confidence: vector.confidence,
        hiddenDimensions: vector.hiddenDimensions, engineVersion: vector.engineVersion, computedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [compatibilityVectors.edgeId, compatibilityVectors.relationshipType],
        set: { dimensions: vector.dimensions, confidence: vector.confidence, hiddenDimensions: vector.hiddenDimensions, engineVersion: vector.engineVersion, computedAt: new Date() },
      });
    await tx
      .insert(narratives)
      .values({
        edgeId, relationshipType: type, headline: narrative.headline, bestDimension: narrative.bestDimension,
        frictionDimension: narrative.frictionDimension, sections: narrative.sections,
        shareableExcerpt: narrative.shareableExcerpt, templateVersion: narrative.templateVersion, generatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [narratives.edgeId, narratives.relationshipType],
        set: { headline: narrative.headline, bestDimension: narrative.bestDimension, frictionDimension: narrative.frictionDimension, sections: narrative.sections, shareableExcerpt: narrative.shareableExcerpt, templateVersion: narrative.templateVersion, generatedAt: new Date() },
      });
  }
}

// ───────────────────────── 조회 ─────────────────────────

export interface EdgeListItem {
  id: string;
  counterpartName: string;
  types: RelationshipType[];
  state: "candidate" | "active" | "revoked";
  inviteToken: string | null;
  headline: string | null;
  iAmA: boolean;
}

/** 내 관계 목록. candidate는 A에게만, active는 양쪽에, revoked는 표시하되 결과 없음. */
export async function listEdgesFor(userId: string): Promise<EdgeListItem[]> {
  const rows = await db.query.relationshipEdges.findMany({
    where: or(eq(relationshipEdges.userAId, userId), eq(relationshipEdges.userBId, userId)),
    orderBy: [desc(relationshipEdges.createdAt)],
    with: { narratives: { columns: { headline: true, relationshipType: true } } },
  });
  const items: EdgeListItem[] = [];
  for (const e of rows) {
    const iAmA = e.userAId === userId;
    if (!iAmA && e.state === "candidate") continue; // B에게 candidate는 보이지 않는다
    const counterpartName = iAmA
      ? e.counterpartLabel
      : await getDisplayName(e.userAId);
    const first = e.types[0];
    const headline = e.narratives.find((n) => n.relationshipType === first)?.headline ?? null;
    items.push({
      id: e.id, counterpartName, types: e.types, state: e.state,
      inviteToken: iAmA && e.state === "candidate" ? e.inviteToken : null,
      headline, iAmA,
    });
  }
  return items;
}

export interface EdgeResultView {
  edgeId: string;
  state: "candidate" | "active" | "revoked";
  iAmA: boolean;
  labelA: string;
  labelB: string;
  types: RelationshipType[];
  results: Record<string, RenderedNarrative>;
  inviteToken: string | null;
}

/** 결과 화면. 본인이 속한 Edge만. active면 유형별 해설을 돌려준다. */
export async function getEdgeResult(edgeId: string, userId: string): Promise<EdgeResultView | null> {
  const e = await db.query.relationshipEdges.findFirst({
    where: eq(relationshipEdges.id, edgeId),
    with: { narratives: true, vectors: true },
  });
  if (!e) return null;
  const iAmA = e.userAId === userId;
  if (!iAmA && e.userBId !== userId) return null;

  const labelA = await getDisplayName(e.userAId);
  const labelB = e.userBId ? await getDisplayName(e.userBId) : e.counterpartLabel;

  const results: Record<string, RenderedNarrative> = {};
  if (e.state === "active") {
    for (const n of e.narratives) {
      const v = e.vectors.find((x) => x.relationshipType === n.relationshipType);
      results[n.relationshipType] = {
        headline: n.headline,
        bestDimension: n.bestDimension as RenderedNarrative["bestDimension"],
        frictionDimension: n.frictionDimension as RenderedNarrative["frictionDimension"],
        sections: n.sections as RenderedNarrative["sections"],
        shareableExcerpt: n.shareableExcerpt as RenderedNarrative["shareableExcerpt"],
        confidenceNote: v ? confidenceNoteFor(v.confidence) : null,
        templateVersion: n.templateVersion,
      };
    }
  }
  return {
    edgeId: e.id, state: e.state, iAmA, labelA, labelB, types: e.types, results,
    inviteToken: iAmA && e.state === "candidate" ? e.inviteToken : null,
  };
}

/** 저장된 confidence만으로 안내 문구를 만든다 (누가 없는지는 Vector에 없으므로 중립 표현) */
function confidenceNoteFor(confidence: "high" | "mid" | "low"): string | null {
  if (confidence === "high") return null;
  if (confidence === "mid") return "한 분의 출생시간이 더해지면 더 정밀해져요";
  return "두 분의 출생시간이 더해지면 더 정밀해져요";
}

/** 내 이름 외 표시용 보조: 사용자 존재 확인 */
export async function userExists(userId: string): Promise<boolean> {
  const row = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { id: true } });
  return !!row;
}
