// 명리 기본 표. 천간·지지의 오행·음양, 지지 본기, 합·충 관계.
import type { Branch, Element, Polarity, Stem, TenGod } from "./types.js";

export const STEMS: readonly Stem[] = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export const BRANCHES: readonly Branch[] = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export const STEM_ELEMENT: Record<Stem, Element> = {
  甲: "wood", 乙: "wood",
  丙: "fire", 丁: "fire",
  戊: "earth", 己: "earth",
  庚: "metal", 辛: "metal",
  壬: "water", 癸: "water",
};

export const STEM_POLARITY: Record<Stem, Polarity> = {
  甲: "yang", 乙: "yin", 丙: "yang", 丁: "yin", 戊: "yang",
  己: "yin", 庚: "yang", 辛: "yin", 壬: "yang", 癸: "yin",
};

export const BRANCH_ELEMENT: Record<Branch, Element> = {
  子: "water", 丑: "earth", 寅: "wood", 卯: "wood", 辰: "earth", 巳: "fire",
  午: "fire", 未: "earth", 申: "metal", 酉: "metal", 戌: "earth", 亥: "water",
};

/** 지지의 본기(本氣). 첫 버전은 지장간 중 본기만 십신 계산에 쓴다. */
export const BRANCH_MAIN_STEM: Record<Branch, Stem> = {
  子: "癸", 丑: "己", 寅: "甲", 卯: "乙", 辰: "戊", 巳: "丙",
  午: "丁", 未: "己", 申: "庚", 酉: "辛", 戌: "戊", 亥: "壬",
};

/** 오행 상생: key가 value를 낳는다 */
export const GENERATES: Record<Element, Element> = {
  wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood",
};
/** 오행 상극: key가 value를 극한다 */
export const CONTROLS: Record<Element, Element> = {
  wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood",
};

/** 천간합 다섯 쌍 */
const STEM_COMBINATIONS: ReadonlyArray<readonly [Stem, Stem]> = [
  ["甲", "己"], ["乙", "庚"], ["丙", "辛"], ["丁", "壬"], ["戊", "癸"],
];
/** 지지 육합 */
const BRANCH_SIX_COMBINATIONS: ReadonlyArray<readonly [Branch, Branch]> = [
  ["子", "丑"], ["寅", "亥"], ["卯", "戌"], ["辰", "酉"], ["巳", "申"], ["午", "未"],
];
/** 지지 삼합 그룹. 같은 그룹의 두 글자는 반합으로 본다 */
const BRANCH_TRIPLE_GROUPS: ReadonlyArray<readonly Branch[]> = [
  ["申", "子", "辰"], ["亥", "卯", "未"], ["寅", "午", "戌"], ["巳", "酉", "丑"],
];
/** 지지 충 */
const BRANCH_CLASHES: ReadonlyArray<readonly [Branch, Branch]> = [
  ["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"],
];

const pairMatches = <T>(pairs: ReadonlyArray<readonly [T, T]>, a: T, b: T): boolean =>
  pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

export const isStemCombination = (a: Stem, b: Stem): boolean => pairMatches(STEM_COMBINATIONS, a, b);
export const isBranchCombination = (a: Branch, b: Branch): boolean =>
  a !== b &&
  (pairMatches(BRANCH_SIX_COMBINATIONS, a, b) ||
    BRANCH_TRIPLE_GROUPS.some((g) => g.includes(a) && g.includes(b)));
export const isBranchClash = (a: Branch, b: Branch): boolean => pairMatches(BRANCH_CLASHES, a, b);

/**
 * 일간(dayMaster) 기준으로 다른 천간(target)의 십신을 구한다.
 * 같은 오행: 비견/겁재 · 내가 낳는 오행: 식신/상관 · 내가 극하는 오행: 편재/정재
 * 나를 극하는 오행: 편관/정관 · 나를 낳는 오행: 편인/정인
 * 음양이 같으면 앞의 것(비견·식신·편재·편관·편인), 다르면 뒤의 것.
 */
export function tenGodOf(dayMaster: Stem, target: Stem): TenGod {
  const me = STEM_ELEMENT[dayMaster];
  const it = STEM_ELEMENT[target];
  const same = STEM_POLARITY[dayMaster] === STEM_POLARITY[target];
  if (it === me) return same ? "bijian" : "geopjae";
  if (GENERATES[me] === it) return same ? "siksin" : "sanggwan";
  if (CONTROLS[me] === it) return same ? "pyeonjae" : "jeongjae";
  if (CONTROLS[it] === me) return same ? "pyeongwan" : "jeonggwan";
  return same ? "pyeonin" : "jeongin";
}

export const TEN_GODS: readonly TenGod[] = [
  "bijian", "geopjae", "siksin", "sanggwan", "pyeonjae",
  "jeongjae", "pyeongwan", "jeonggwan", "pyeonin", "jeongin",
];
export const ELEMENTS: readonly Element[] = ["wood", "fire", "earth", "metal", "water"];
