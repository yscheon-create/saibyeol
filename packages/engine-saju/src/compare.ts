// compare(): 두 파생 프로파일 → 관계 유형별 정합도 벡터.
// 첫 버전은 공통 4차원만 계산한다. 유형별 차원은 docs/dimensions.md 표가 채워지면 추가한다.
import { ENGINE_VERSION } from "./derive";
import { CONTROLS, GENERATES, isBranchClash, isBranchCombination, isStemCombination } from "./tables";
import type {
  CommonDimension, CompatibilityVector, Confidence, DerivedProfile, DimensionResult, Element, Level, RelationshipType,
} from "./types";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/**
 * 유사도 척도 계수. 축 값 차이에 곱한 뒤 1에서 뺀다.
 * 1이면 차이 0.33까지 "잘 맞아요"가 되어 무작위 쌍의 70~85%가 aligned로 쏠린다(2026-10-19 분포 확인).
 * 2이면 차이 ≤0.165 aligned, ≥0.33 tense — 무작위 쌍 기준 대략 aligned 25~50% / different 30~50% / tense 15~30%.
 * 첫 사용자 테스트 뒤 조정 대상. docs/dimensions.md "점수 → 단계" 참고.
 */
export const SIMILARITY_SCALE = 2;
/** 유사도. 축 값이 가까울수록 1 */
const similarity = (a: number, b: number) => clamp01(1 - Math.abs(a - b) * SIMILARITY_SCALE);
/** 한 단계 = 점수 척도의 1/3 */
const ONE_LEVEL = 1 / 3;

/** 점수 → 세 단계. 경계값은 docs/dimensions.md "점수 → 단계" */
export function toLevel(score: number): Level {
  if (score >= 0.67) return "aligned";
  if (score >= 0.34) return "different";
  return "tense";
}

/** 축 값 → 문장 단서. 중립 구간은 세 번째 값 */
function clueByAxis(v: number, high: string, low: string, mid: string, hi = 0.6, lo = 0.4): string {
  if (v >= hi) return high;
  if (v <= lo) return low;
  return mid;
}

function communication(a: DerivedProfile, b: DerivedProfile): DimensionResult {
  const ta = a.traits.communication;
  const tb = b.traits.communication;
  const score = (similarity(ta.order, tb.order) + similarity(ta.speed, tb.speed)) / 2;
  // 단서: 두 축 중 더 치우친 축의 단서를 쓴다
  const clue = (t: { order: number; speed: number }) => {
    const orderDev = Math.abs(t.order - 0.5);
    const speedDev = Math.abs(t.speed - 0.5);
    return orderDev >= speedDev
      ? clueByAxis(t.order, "direct", "contextual", "balanced")
      : clueByAxis(t.speed, "quick", "listener", "balanced");
  };
  return { dimension: "communication", score, level: toLevel(score), clueA: clue(ta), clueB: clue(tb) };
}

function emotional(a: DerivedProfile, b: DerivedProfile): DimensionResult {
  const ea = a.traits.emotional.expression;
  const eb = b.traits.emotional.expression;
  let score = similarity(ea, eb);
  // 둘 다 강하게 드러내는 쪽이면 같은 방향 과열: 한 단계 내린다
  if (ea >= 0.8 && eb >= 0.8) score = clamp01(score - ONE_LEVEL);
  const clue = (v: number) => clueByAxis(v, "expressive", "contained", "steady", 0.65, 0.35);
  return { dimension: "emotional", score, level: toLevel(score), clueA: clue(ea), clueB: clue(eb) };
}

function pace(a: DerivedProfile, b: DerivedProfile): DimensionResult {
  const da = a.traits.pace.drive;
  const db = b.traits.pace.drive;
  const score = similarity(da, db);
  const clue = (v: number) => clueByAxis(v, "fast", "deliberate", "moderate");
  return { dimension: "pace", score, level: toLevel(score), clueA: clue(da), clueB: clue(db) };
}

/** 극의 방향별 마찰 장면. [극하는 쪽 단서, 극 받는 쪽 단서, 장면 이름] */
const CONTROL_SCENES: Record<Element, readonly [string, string, string]> = {
  wood: ["push", "hold", "push-hold"], // 목극토: 밀어붙임 vs 버팀 (주도권)
  earth: ["frame", "flow", "frame-flow"], // 토극수: 틀 잡기 vs 흘러가기 (자유도)
  water: ["cool", "heat", "cool-heat"], // 수극화: 식힘 vs 달아오름 (온도)
  fire: ["melt", "hold-firm", "melt-hold"], // 화극금: 녹임 vs 지킴 (원칙)
  metal: ["cut", "grow", "cut-grow"], // 금극목: 자르기 vs 뻗기 (간섭)
};

function friction(a: DerivedProfile, b: DerivedProfile): DimensionResult {
  const fa = a.traits.friction;
  const fb = b.traits.friction;
  let score: number;
  let clueA: string;
  let clueB: string;
  let scene: string;

  if (fa.element === fb.element) {
    score = 0.5; clueA = clueB = "mirror"; scene = "mirror";
  } else if (isStemCombination(fa.dayStem, fb.dayStem)) {
    // 천간합. 첫 버전은 상생과 같은 값. "끌림/묶임" 양면은 검토 포인트
    score = 0.8; clueA = clueB = "bond"; scene = "bond";
  } else if (GENERATES[fa.element] === fb.element) {
    score = 0.8; clueA = "feeder"; clueB = "fed"; scene = "feed";
  } else if (GENERATES[fb.element] === fa.element) {
    score = 0.8; clueA = "fed"; clueB = "feeder"; scene = "feed";
  } else if (CONTROLS[fa.element] === fb.element) {
    const [c, r, s] = CONTROL_SCENES[fa.element];
    score = 0.25; clueA = c; clueB = r; scene = s;
  } else {
    const [c, r, s] = CONTROL_SCENES[fb.element];
    score = 0.25; clueA = r; clueB = c; scene = s;
  }

  if (isBranchCombination(fa.dayBranch, fb.dayBranch)) score += 0.15;
  if (isBranchClash(fa.dayBranch, fb.dayBranch)) score -= 0.15;
  score = clamp01(score);

  return { dimension: "friction", score, level: toLevel(score), clueA, clueB, scene };
}

/** 신뢰도: 첫 버전은 출생시간 유무만 본다 */
export function confidenceOf(a: DerivedProfile, b: DerivedProfile): Confidence {
  if (a.hasBirthTime && b.hasBirthTime) return "high";
  if (a.hasBirthTime || b.hasBirthTime) return "mid";
  return "low";
}

/** 두 파생 프로파일 → 정합도 벡터. 순수 함수. 같은 입력이면 같은 출력. */
export function compare(a: DerivedProfile, b: DerivedProfile, relationshipType: RelationshipType): CompatibilityVector {
  const dimensions: Record<CommonDimension, DimensionResult> = {
    communication: communication(a, b),
    emotional: emotional(a, b),
    pace: pace(a, b),
    friction: friction(a, b),
  };
  return {
    engine: "saju",
    engineVersion: ENGINE_VERSION,
    relationshipType,
    confidence: confidenceOf(a, b),
    hiddenDimensions: [], // 공통 4차원은 시주 의존이 높지 않아 숨기지 않는다
    dimensions,
  };
}
