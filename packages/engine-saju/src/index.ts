// @saibyeol/engine-saju — 첫 번째 해석 엔진.
// 바깥에서 쓰는 것은 derive, compare 두 함수와 타입뿐이다. 이 패키지는 자기 폴더 밖의 어떤 것도 import하지 않는다.
export { derive, ENGINE_VERSION } from "./derive.js";
export { compare } from "./compare.js";
export type {
  SourceDataInput, DerivedProfile, CompatibilityVector, DimensionResult,
  RelationshipType, CommonDimension, Level, Confidence, Pillars, Pillar,
} from "./types.js";
