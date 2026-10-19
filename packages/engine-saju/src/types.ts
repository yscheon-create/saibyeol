// 사이별 해석 엔진 — 타입 정의
// 이 파일의 타입은 엔진 바깥(서버·화면)이 엔진과 주고받는 유일한 계약이다.

/** 천간. 갑을병정무기경신임계 */
export type Stem = "甲" | "乙" | "丙" | "丁" | "戊" | "己" | "庚" | "辛" | "壬" | "癸";
/** 지지. 자축인묘진사오미신유술해 */
export type Branch = "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥";
/** 오행 */
export type Element = "wood" | "fire" | "earth" | "metal" | "water";
/** 음양 */
export type Polarity = "yang" | "yin";

/** 십신. 일간을 기준으로 다른 글자에 붙는 열 가지 역할 이름 */
export type TenGod =
  | "bijian" // 비견
  | "geopjae" // 겁재
  | "siksin" // 식신
  | "sanggwan" // 상관
  | "pyeonjae" // 편재
  | "jeongjae" // 정재
  | "pyeongwan" // 편관
  | "jeonggwan" // 정관
  | "pyeonin" // 편인
  | "jeongin"; // 정인

/** 엔진에 들어오는 개인 원천정보. 데이터베이스의 SourceData와 같은 모양이지만 엔진은 이 객체만 받는다. */
export interface SourceDataInput {
  /** YYYY-MM-DD. calendarType 기준의 날짜 */
  birthDate: string;
  calendarType: "solar" | "lunar";
  /** 음력 윤달 여부. 양력이면 false */
  isLeapMonth: boolean;
  /** HH:mm (한국 표준시). null이면 "모름" */
  birthTime: string | null;
  gender: "female" | "male";
}

export interface Pillar {
  stem: Stem;
  branch: Branch;
}

/** 사주 네 기둥. 출생시간이 없으면 hour는 null */
export interface Pillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
}

/** 십신 가중 분포. 일간 자신은 세지 않는다 */
export type TenGodDistribution = Record<TenGod, number>;
/** 오행 가중 분포. 여덟(또는 여섯) 글자 전부 */
export type ElementDistribution = Record<Element, number>;

/** 공통 4차원의 개인 성향값 */
export interface CommonTraits {
  communication: {
    /** 0 = 맥락 먼저, 1 = 결론 먼저 */
    order: number;
    /** 0 = 듣고 답함, 1 = 바로 말함 */
    speed: number;
  };
  emotional: {
    /** 0 = 안으로 삭임, 1 = 겉으로 드러냄 */
    expression: number;
  };
  pace: {
    /** 0 = 충분히 보고 움직임, 1 = 일단 움직임 */
    drive: number;
  };
  friction: {
    dayStem: Stem;
    dayBranch: Branch;
    element: Element;
  };
}

export interface DerivedProfile {
  engine: "saju";
  engineVersion: string;
  hasBirthTime: boolean;
  pillars: Pillars;
  dayMaster: { stem: Stem; element: Element; polarity: Polarity };
  tenGods: TenGodDistribution;
  elements: ElementDistribution;
  traits: CommonTraits;
}

export type RelationshipType = "family" | "friend" | "romance" | "coworker";
export type CommonDimension = "communication" | "emotional" | "pace" | "friction";
export type Level = "aligned" | "different" | "tense";
export type Confidence = "high" | "mid" | "low";

/** 한 차원의 비교 결과 */
export interface DimensionResult {
  dimension: CommonDimension;
  /** 0~1 */
  score: number;
  level: Level;
  /** 문장 단서. 템플릿의 {A_trait} {B_trait} 자리에 들어갈 식별자 */
  clueA: string;
  clueB: string;
  /** friction에만 있음. 마찰 장면 식별자 */
  scene?: string;
}

export interface CompatibilityVector {
  engine: "saju";
  engineVersion: string;
  relationshipType: RelationshipType;
  confidence: Confidence;
  /** 시주 없음으로 숨긴 차원 (공통 4차원에는 없음) */
  hiddenDimensions: CommonDimension[];
  dimensions: Record<CommonDimension, DimensionResult>;
}
