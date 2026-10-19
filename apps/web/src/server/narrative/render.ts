// 정합도 벡터 + 호칭 → 사용자가 읽는 문장. 원천정보는 받지 않는다.
import type { CommonDimension, CompatibilityVector, DimensionResult, Level } from "@saibyeol/engine-saju";
import { CLUES, CONFIDENCE_NOTE, DIMENSION_LABEL, HEADLINES, LEVEL_LABEL, TEMPLATES, TEMPLATE_VERSION } from "./templates";

export interface NarrativeSection {
  dimension: CommonDimension;
  label: string;
  level: Level;
  levelLabel: string;
  observation: string;
  interplay: string;
  howTo: string;
}

export interface ShareableExcerpt {
  labelA: string;
  labelB: string;
  relationshipType: string;
  headline: string;
  best: { dimension: CommonDimension; label: string };
  friction: { dimension: CommonDimension; label: string };
}

export interface RenderedNarrative {
  headline: string;
  bestDimension: CommonDimension;
  frictionDimension: CommonDimension;
  sections: NarrativeSection[];
  shareableExcerpt: ShareableExcerpt;
  confidenceNote: string | null;
  templateVersion: string;
}

/** 받침 유무에 따른 조사. 한글이 아니면 받침 없는 쪽을 쓴다. */
export function josa(word: string, pair: "은" | "이" | "와" | "을"): string {
  const last = word.charCodeAt(word.length - 1);
  const isHangul = last >= 0xac00 && last <= 0xd7a3;
  const hasFinal = isHangul && (last - 0xac00) % 28 !== 0;
  const table = { 은: ["은", "는"], 이: ["이", "가"], 와: ["과", "와"], 을: ["을", "를"] } as const;
  return word + table[pair][hasFinal ? 0 : 1];
}

/** 같은 관계는 항상 같은 변형을 고르도록 edgeId로 결정적인 인덱스를 만든다 */
function pickIndex(seed: string, length: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return length === 0 ? 0 : h % length;
}

function fill(template: string, a: string, b: string, traitA: string, traitB: string): string {
  return template
    .replace(/\{A:(은|이|와|을)\}/g, (_, p) => josa(a, p))
    .replace(/\{B:(은|이|와|을)\}/g, (_, p) => josa(b, p))
    .replace(/\{A_trait\}/g, traitA)
    .replace(/\{B_trait\}/g, traitB)
    .replace(/\{A\}/g, a)
    .replace(/\{B\}/g, b);
}

const ORDER: CommonDimension[] = ["communication", "emotional", "pace", "friction"];

export function renderNarrative(
  vector: CompatibilityVector,
  labelA: string,
  labelB: string,
  seed: string,
  /** 출생시간이 없는 쪽. 신뢰도 안내 문구에 쓴다 */
  missingBirthTime: { a: boolean; b: boolean },
): RenderedNarrative {
  const sections: NarrativeSection[] = ORDER.map((dim) => {
    const r: DimensionResult = vector.dimensions[dim];
    const variants = TEMPLATES[dim][r.level];
    const v = variants[pickIndex(seed + dim, variants.length)]!;
    const traitA = CLUES[r.clueA] ?? r.clueA;
    const traitB = CLUES[r.clueB] ?? r.clueB;
    const same = r.clueA === r.clueB;
    const observationTpl = same && v.observationSame ? v.observationSame : v.observation;
    return {
      dimension: dim,
      label: DIMENSION_LABEL[dim],
      level: r.level,
      levelLabel: LEVEL_LABEL[r.level],
      observation: fill(observationTpl, labelA, labelB, traitA, traitB),
      interplay: fill(v.interplay, labelA, labelB, traitA, traitB),
      howTo: fill(v.howTo, labelA, labelB, traitA, traitB),
    };
  });

  // 가장 잘 맞는 차원 = 점수 최고, 가장 부딪히는 차원 = 점수 최저 (동점이면 ORDER 순)
  const scored = ORDER.map((d) => ({ d, s: vector.dimensions[d].score }));
  const best = scored.reduce((m, x) => (x.s > m.s ? x : m)).d;
  const friction = scored.reduce((m, x) => (x.s < m.s ? x : m)).d;

  // 헤드라인: 부딪히는 차원의 단서가 다르면 대비형, 아니면 상황별 문구
  const fr = vector.dimensions[friction];
  let headline: string;
  if (fr.level === "aligned") headline = HEADLINES.allAligned;
  else if (fr.clueA !== fr.clueB && CLUES[fr.clueA] && CLUES[fr.clueB])
    headline = fill(HEADLINES.contrast, labelA, labelB, CLUES[fr.clueA]!, CLUES[fr.clueB]!);
  else headline = HEADLINES.sameRhythm;

  const confidenceNote =
    missingBirthTime.a && missingBirthTime.b ? CONFIDENCE_NOTE.low
    : missingBirthTime.a ? CONFIDENCE_NOTE.mid.replace("{B}", labelA)
    : missingBirthTime.b ? CONFIDENCE_NOTE.mid.replace("{B}", labelB)
    : null;

  return {
    headline,
    bestDimension: best,
    frictionDimension: friction,
    sections,
    shareableExcerpt: {
      labelA, labelB,
      relationshipType: vector.relationshipType,
      headline,
      best: { dimension: best, label: DIMENSION_LABEL[best] },
      friction: { dimension: friction, label: DIMENSION_LABEL[friction] },
    },
    confidenceNote,
    templateVersion: TEMPLATE_VERSION,
  };
}
