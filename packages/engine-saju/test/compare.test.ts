import { describe, expect, it } from "vitest";
import { compare, confidenceOf, toLevel } from "../src/compare.js";
import { derive } from "../src/derive.js";
import type { Branch, DerivedProfile, SourceDataInput, Stem } from "../src/types.js";
import { STEM_ELEMENT, STEM_POLARITY } from "../src/tables.js";

/** 규칙 검증용 최소 프로파일. 축 값과 일주만 지정한다. */
function fake(opts: {
  order?: number; speed?: number; expression?: number; drive?: number;
  dayStem?: Stem; dayBranch?: Branch; hasBirthTime?: boolean;
}): DerivedProfile {
  const stem = opts.dayStem ?? "甲";
  const branch = opts.dayBranch ?? "子";
  const pillar = { stem, branch };
  return {
    engine: "saju", engineVersion: "test", hasBirthTime: opts.hasBirthTime ?? true,
    pillars: { year: pillar, month: pillar, day: pillar, hour: pillar },
    dayMaster: { stem, element: STEM_ELEMENT[stem], polarity: STEM_POLARITY[stem] },
    tenGods: { bijian: 0, geopjae: 0, siksin: 0, sanggwan: 0, pyeonjae: 0, jeongjae: 0, pyeongwan: 0, jeonggwan: 0, pyeonin: 0, jeongin: 0 },
    elements: { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 },
    traits: {
      communication: { order: opts.order ?? 0.5, speed: opts.speed ?? 0.5 },
      emotional: { expression: opts.expression ?? 0.5 },
      pace: { drive: opts.drive ?? 0.5 },
      friction: { dayStem: stem, dayBranch: branch, element: STEM_ELEMENT[stem] },
    },
  };
}

describe("toLevel: 점수 → 세 단계", () => {
  it("경계값", () => {
    expect(toLevel(0.67)).toBe("aligned");
    expect(toLevel(0.66)).toBe("different");
    expect(toLevel(0.34)).toBe("different");
    expect(toLevel(0.33)).toBe("tense");
  });
});

describe("유사도 척도: 차이 × SIMILARITY_SCALE(2)", () => {
  it("차이 0.16이면 aligned, 0.33이면 tense 경계", () => {
    const near = compare(fake({ drive: 0.5 }), fake({ drive: 0.66 }), "friend");
    expect(near.dimensions.pace.level).toBe("aligned");
    const far = compare(fake({ drive: 0.5 }), fake({ drive: 0.84 }), "friend");
    expect(far.dimensions.pace.level).toBe("tense");
  });
});

describe("communication: 두 축 유사도의 평균", () => {
  it("같으면 1, 두 축 모두 반대면 낮다", () => {
    const same = compare(fake({ order: 0.8, speed: 0.3 }), fake({ order: 0.8, speed: 0.3 }), "friend");
    expect(same.dimensions.communication.score).toBeCloseTo(1, 5);
    const opposite = compare(fake({ order: 0.9, speed: 0.9 }), fake({ order: 0.1, speed: 0.1 }), "friend");
    expect(opposite.dimensions.communication.score).toBeCloseTo(0, 5); // 차이 0.8 × 2 → 0으로 잘림
    expect(opposite.dimensions.communication.level).toBe("tense");
  });
  it("단서는 더 치우친 축에서 나온다", () => {
    const r = compare(fake({ order: 0.9, speed: 0.55 }), fake({ order: 0.45, speed: 0.1 }), "friend");
    expect(r.dimensions.communication.clueA).toBe("direct");
    expect(r.dimensions.communication.clueB).toBe("listener");
  });
});

describe("emotional: 유사도, 둘 다 과열이면 한 단계 아래", () => {
  it("둘 다 0.9면 유사도 1에서 1/3을 뺀다", () => {
    const r = compare(fake({ expression: 0.9 }), fake({ expression: 0.9 }), "romance");
    expect(r.dimensions.emotional.score).toBeCloseTo(2 / 3, 5);
    expect(r.dimensions.emotional.level).toBe("different");
    expect(r.dimensions.emotional.clueA).toBe("expressive");
  });
  it("한쪽만 높으면 그대로 유사도", () => {
    const r = compare(fake({ expression: 0.9 }), fake({ expression: 0.3 }), "romance");
    expect(r.dimensions.emotional.score).toBeCloseTo(0, 5); // 차이 0.6 × 2 = 1.2 → 0
    expect(r.dimensions.emotional.clueB).toBe("contained");
  });
});

describe("pace: 유사도", () => {
  it("단서 fast / deliberate / moderate", () => {
    const r = compare(fake({ drive: 0.7 }), fake({ drive: 0.5 }), "coworker");
    expect(r.dimensions.pace.score).toBeCloseTo(0.6, 5); // 차이 0.2 × 2 = 0.4
    expect(r.dimensions.pace.clueA).toBe("fast");
    expect(r.dimensions.pace.clueB).toBe("moderate");
  });
});

describe("friction: 일간·일지 관계 분류", () => {
  it("상극 + 일지 충: 목극토, 辰戌충 → 0.10 tense, push-hold", () => {
    const r = compare(fake({ dayStem: "甲", dayBranch: "辰" }), fake({ dayStem: "戊", dayBranch: "戌" }), "family");
    const f = r.dimensions.friction;
    expect(f.score).toBeCloseTo(0.1, 5);
    expect(f.level).toBe("tense");
    expect([f.clueA, f.clueB, f.scene]).toEqual(["push", "hold", "push-hold"]);
  });
  it("극 받는 쪽이 A여도 장면은 같고 단서만 뒤집힌다", () => {
    const r = compare(fake({ dayStem: "甲", dayBranch: "寅" }), fake({ dayStem: "庚", dayBranch: "午" }), "family");
    expect([r.dimensions.friction.clueA, r.dimensions.friction.clueB, r.dimensions.friction.scene])
      .toEqual(["grow", "cut", "cut-grow"]);
  });
  it("천간합 + 일지 육합: 甲己, 子丑 → 0.95 aligned, bond", () => {
    const r = compare(fake({ dayStem: "甲", dayBranch: "子" }), fake({ dayStem: "己", dayBranch: "丑" }), "romance");
    expect(r.dimensions.friction.score).toBeCloseTo(0.95, 5);
    expect(r.dimensions.friction.scene).toBe("bond");
  });
  it("상생: 수생목 → feed, 낳는 쪽이 feeder", () => {
    const r = compare(fake({ dayStem: "壬", dayBranch: "申" }), fake({ dayStem: "甲", dayBranch: "午" }), "friend");
    expect([r.dimensions.friction.clueA, r.dimensions.friction.clueB]).toEqual(["feeder", "fed"]);
    expect(r.dimensions.friction.score).toBeCloseTo(0.8, 5);
  });
  it("같은 오행 → mirror 0.5 different", () => {
    const r = compare(fake({ dayStem: "丙", dayBranch: "寅" }), fake({ dayStem: "丁", dayBranch: "巳" }), "friend");
    expect(r.dimensions.friction.scene).toBe("mirror");
    expect(r.dimensions.friction.level).toBe("different");
  });
  it("점수는 0~1을 벗어나지 않는다 (상극 + 충 = 0.10, 합 + 합 = 0.95)", () => {
    const lo = compare(fake({ dayStem: "壬", dayBranch: "子" }), fake({ dayStem: "丙", dayBranch: "午" }), "friend");
    expect(lo.dimensions.friction.score).toBeGreaterThanOrEqual(0);
    const hi = compare(fake({ dayStem: "乙", dayBranch: "卯" }), fake({ dayStem: "庚", dayBranch: "戌" }), "friend");
    expect(hi.dimensions.friction.score).toBeLessThanOrEqual(1);
  });
});

describe("confidence: 출생시간 유무", () => {
  it("둘 다 있으면 high, 하나면 mid, 없으면 low", () => {
    expect(confidenceOf(fake({ hasBirthTime: true }), fake({ hasBirthTime: true }))).toBe("high");
    expect(confidenceOf(fake({ hasBirthTime: true }), fake({ hasBirthTime: false }))).toBe("mid");
    expect(confidenceOf(fake({ hasBirthTime: false }), fake({ hasBirthTime: false }))).toBe("low");
  });
});

describe("compare: 끝에서 끝까지", () => {
  const person = (birthDate: string, birthTime: string | null): SourceDataInput => ({
    birthDate, birthTime, calendarType: "solar", isLeapMonth: false, gender: "female",
  });

  it("실제 두 생년월일시로 네 차원이 모두 나오고, 같은 입력이면 같은 출력", () => {
    const a = derive(person("1990-05-15", "14:30"));
    const b = derive(person("1988-12-03", null));
    const r1 = compare(a, b, "family");
    const r2 = compare(a, b, "family");
    expect(r1).toEqual(r2);
    expect(r1.confidence).toBe("mid");
    expect(r1.hiddenDimensions).toEqual([]);
    for (const d of ["communication", "emotional", "pace", "friction"] as const) {
      const x = r1.dimensions[d];
      expect(x.score).toBeGreaterThanOrEqual(0);
      expect(x.score).toBeLessThanOrEqual(1);
      expect(["aligned", "different", "tense"]).toContain(x.level);
      expect(x.clueA).toBeTruthy();
      expect(x.clueB).toBeTruthy();
    }
  });

  it("관계 유형이 결과에 기록된다 (첫 버전은 점수는 같고 유형만 다르다)", () => {
    const a = derive(person("1990-05-15", "14:30"));
    const b = derive(person("1992-08-21", "09:00"));
    expect(compare(a, b, "family").relationshipType).toBe("family");
    expect(compare(a, b, "coworker").relationshipType).toBe("coworker");
  });
});
