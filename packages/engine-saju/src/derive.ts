// derive(): 개인 원천정보 → 파생 프로파일.
// 규칙의 원본은 docs/dimensions.md "공통 계산 방식"과 공통 4차원 표다. 여기 없는 규칙은 쓰지 않는다.
import { toPillars } from "./calendar.js";
import {
  BRANCH_ELEMENT, BRANCH_MAIN_STEM, ELEMENTS, STEM_ELEMENT, STEM_POLARITY, TEN_GODS, tenGodOf,
} from "./tables.js";
import type {
  CommonTraits, DerivedProfile, ElementDistribution, Pillars, SourceDataInput, Stem, TenGodDistribution,
} from "./types.js";

export const ENGINE_VERSION = "0.1.0";

/** 자리 가중치. 월지 2.0, 일지 1.5, 그 외 1.0. 일간은 기준이므로 십신에 세지 않는다. */
const WEIGHT = { yearStem: 1, yearBranch: 1, monthStem: 1, monthBranch: 2, dayBranch: 1.5, hourStem: 1, hourBranch: 1 } as const;

/** 두 묶음의 비중을 0~1 축으로. 둘 다 0이면 0.5. 작은 표본에서 극단값이 나오지 않도록 완충값 0.5를 더한다. */
const SMOOTHING = 0.5;
export function axis(a: number, b: number): number {
  return (a + SMOOTHING) / (a + b + 2 * SMOOTHING);
}
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function emptyTenGods(): TenGodDistribution {
  return Object.fromEntries(TEN_GODS.map((g) => [g, 0])) as TenGodDistribution;
}
function emptyElements(): ElementDistribution {
  return Object.fromEntries(ELEMENTS.map((e) => [e, 0])) as ElementDistribution;
}

/** 십신 가중 분포. 지지는 본기 천간으로 십신을 정한다. */
export function countTenGods(pillars: Pillars): TenGodDistribution {
  const me = pillars.day.stem;
  const out = emptyTenGods();
  const add = (stem: Stem, w: number) => { out[tenGodOf(me, stem)] += w; };
  add(pillars.year.stem, WEIGHT.yearStem);
  add(BRANCH_MAIN_STEM[pillars.year.branch], WEIGHT.yearBranch);
  add(pillars.month.stem, WEIGHT.monthStem);
  add(BRANCH_MAIN_STEM[pillars.month.branch], WEIGHT.monthBranch);
  add(BRANCH_MAIN_STEM[pillars.day.branch], WEIGHT.dayBranch);
  if (pillars.hour) {
    add(pillars.hour.stem, WEIGHT.hourStem);
    add(BRANCH_MAIN_STEM[pillars.hour.branch], WEIGHT.hourBranch);
  }
  return out;
}

/** 오행 가중 분포. 일간을 포함한 모든 글자. 지지는 지지 자체의 오행. */
export function countElements(pillars: Pillars): ElementDistribution {
  const out = emptyElements();
  out[STEM_ELEMENT[pillars.year.stem]] += WEIGHT.yearStem;
  out[BRANCH_ELEMENT[pillars.year.branch]] += WEIGHT.yearBranch;
  out[STEM_ELEMENT[pillars.month.stem]] += WEIGHT.monthStem;
  out[BRANCH_ELEMENT[pillars.month.branch]] += WEIGHT.monthBranch;
  out[STEM_ELEMENT[pillars.day.stem]] += 1; // 일간
  out[BRANCH_ELEMENT[pillars.day.branch]] += WEIGHT.dayBranch;
  if (pillars.hour) {
    out[STEM_ELEMENT[pillars.hour.stem]] += WEIGHT.hourStem;
    out[BRANCH_ELEMENT[pillars.hour.branch]] += WEIGHT.hourBranch;
  }
  return out;
}

/** 공통 4차원의 개인값. 규칙은 docs/dimensions.md 표와 1:1. */
export function commonTraits(pillars: Pillars, g: TenGodDistribution, e: ElementDistribution): CommonTraits {
  const me = pillars.day.stem;
  const yangBonus = STEM_POLARITY[me] === "yang" ? 0.1 : 0;
  const yinBonus = STEM_POLARITY[me] === "yin" ? 0.1 : 0;

  // 대화의 결 — 순서축: (상관+편재, 양간 +0.1) vs (식신+정인, 음간 +0.1)
  const order = clamp01(axis(g.sanggwan + g.pyeonjae, g.siksin + g.jeongin) + yangBonus - yinBonus);
  // 대화의 결 — 속도축: (비겁+상관) vs (인성+정관)
  const speed = axis(g.bijian + g.geopjae + g.sanggwan, g.pyeonin + g.jeongin + g.jeonggwan);
  // 감정의 온도 — 표출축: (화+상관+겁재) vs (수+정인+편인), 금은 양쪽에 절반씩
  const expression = axis(
    e.fire + g.sanggwan + g.geopjae + e.metal * 0.5,
    e.water + g.jeongin + g.pyeonin + e.metal * 0.5,
  );
  // 생활의 속도 — 추진축: (비겁+상관+편관) vs (정인+정관+정재)
  const drive = axis(g.bijian + g.geopjae + g.sanggwan + g.pyeongwan, g.jeongin + g.jeonggwan + g.jeongjae);

  return {
    communication: { order, speed },
    emotional: { expression },
    pace: { drive },
    friction: { dayStem: me, dayBranch: pillars.day.branch, element: STEM_ELEMENT[me] },
  };
}

/** 개인 원천정보 → 파생 프로파일. 순수 함수. */
export function derive(input: SourceDataInput): DerivedProfile {
  const pillars = toPillars(input);
  const tenGods = countTenGods(pillars);
  const elements = countElements(pillars);
  const me = pillars.day.stem;
  return {
    engine: "saju",
    engineVersion: ENGINE_VERSION,
    hasBirthTime: pillars.hour !== null,
    pillars,
    dayMaster: { stem: me, element: STEM_ELEMENT[me], polarity: STEM_POLARITY[me] },
    tenGods,
    elements,
    traits: commonTraits(pillars, tenGods, elements),
  };
}
