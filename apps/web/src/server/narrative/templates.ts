// 해설 문장 템플릿 — 공통 4차원. 원본 문서는 docs/narrative-templates.md.
// communication은 문서의 예시 그대로, 나머지 세 차원은 개발 진행을 위한 초안이며 기획자가 다듬는다.
// 규칙: 한 문장 25자 안팎, 단정형·명령형 금지, 명리 용어 금지, 다루는 법은 양쪽 모두가 할 수 있는 행동으로.
// {A} {B} = 호칭, {A_trait} {B_trait} = 아래 CLUES의 문장 조각. 조사는 렌더러가 붙인다: {A:은} {A:이} {A:와}
import type { CommonDimension, Level } from "@saibyeol/engine-saju";

export const TEMPLATE_VERSION = "0.1.0";

export const DIMENSION_LABEL: Record<CommonDimension, string> = {
  communication: "대화의 결",
  emotional: "감정의 온도",
  pace: "생활의 속도",
  friction: "부딪히는 지점",
};

export const LEVEL_LABEL: Record<Level, string> = {
  aligned: "잘 맞아요",
  different: "다른 결이에요",
  tense: "부딪힐 수 있어요",
};

/** 문장 단서 → 성향 조각 ({A_trait} 자리) */
export const CLUES: Record<string, string> = {
  // communication
  direct: "결론부터 말하는 편",
  contextual: "맥락을 먼저 깔고 말하는 편",
  quick: "떠오르는 대로 바로 말하는 편",
  listener: "듣고 나서 천천히 답하는 편",
  balanced: "상황 따라 순서를 바꾸는 편",
  // emotional
  expressive: "감정이 빨리 올라오고 겉으로 보이는 편",
  contained: "감정이 안에서 오래 머무는 편",
  steady: "표현은 적지만 꾸준한 편",
  // pace
  fast: "결정도 수정도 빠른 편",
  deliberate: "확인하고 움직이는 편",
  moderate: "상황을 보며 속도를 조절하는 편",
  // friction
  mirror: "닮은 결을 가진 쪽",
  bond: "서로에게 끌리는 결을 가진 쪽",
  feeder: "상대를 채워주는 쪽",
  fed: "상대에게 채워지는 쪽",
  push: "밀어붙이는 쪽",
  hold: "버티는 쪽",
  frame: "틀을 잡는 쪽",
  flow: "흘러가는 쪽",
  cool: "식히는 쪽",
  heat: "달아오르는 쪽",
  melt: "녹이는 쪽",
  "hold-firm": "지키는 쪽",
  cut: "자르는 쪽",
  grow: "뻗어나가는 쪽",
};

export interface Variant {
  /** 두 사람의 단서가 다를 때 */
  observation: string;
  /** 두 사람의 단서가 같을 때 (없으면 observation 사용) */
  observationSame?: string;
  interplay: string;
  howTo: string;
}

type DimensionTemplates = Record<Level, Variant[]>;

export const TEMPLATES: Record<CommonDimension, DimensionTemplates> = {
  communication: {
    aligned: [
      {
        observation: "{A:은} {A_trait}이고, {B}도 {B_trait}이에요.",
        observationSame: "두 분 모두 {A_trait}이에요.",
        interplay: "말이 길어지지 않아도 서로 알아듣는 편이에요.",
        howTo: "다만 너무 빨리 통한다고 느낄 때, 한 번쯤 \"내가 이해한 게 맞아?\" 하고 확인하면 더 단단해져요.",
      },
      {
        observation: "{A:은} {A_trait}이고, {B}도 {B_trait}이에요.",
        observationSame: "두 분 모두 {A_trait}이에요.",
        interplay: "설명을 덧붙이지 않아도 뜻이 통하는 사이예요.",
        howTo: "잘 통하는 만큼 중요한 이야기일수록 한 번 더 되묻는 습관이 도움이 돼요.",
      },
    ],
    different: [
      {
        observation: "{A:은} {A_trait}이고, {B:은} {B_trait}이에요.",
        interplay: "그래서 {B:은} {A:이} 성급하다고 느끼고, {A:은} {B:이} 답답하다고 느낄 수 있어요.",
        howTo: "중요한 이야기는 {A:이} 결론을 잠시 미루고, {B:이} 맥락을 한 문장으로 줄여보는 것만으로 달라져요.",
      },
      {
        observation: "같은 이야기를 {A:은} {A_trait}, {B:은} {B_trait}으로 꺼내요.",
        interplay: "서로의 말이 끝나기 전에 다음 생각이 먼저 나올 수 있어요.",
        howTo: "각자 상대 방식으로 한 번씩 말해보는 날을 만들어 보는 것도 방법이에요.",
      },
    ],
    tense: [
      {
        observation: "{A:은} {A_trait}이고, {B:은} {B_trait}이에요.",
        interplay: "같은 뜻으로 말해도 서로 다른 말로 들릴 때가 생겨요.",
        howTo: "어긋났다고 느낄 때 \"지금 무슨 뜻이었어?\" 한 마디를 먼저 꺼내는 쪽이 생기면 많이 풀려요.",
      },
      {
        observation: "{A:와} {B:은} 말을 꺼내는 순서가 반대인 편이에요.",
        interplay: "대화가 길어질수록 내용보다 말투에 마음이 쓰이기 쉬워요.",
        howTo: "중요한 이야기는 글로 한 번 정리해 주고받아 보는 것도 방법이에요.",
      },
    ],
  },

  emotional: {
    aligned: [
      {
        observation: "{A:은} {A_trait}이고, {B}도 {B_trait}이에요.",
        observationSame: "두 분 모두 {A_trait}이에요.",
        interplay: "감정이 오르내리는 속도가 비슷해서 서로의 기분을 설명 없이 알아채기 쉬워요.",
        howTo: "비슷한 만큼 같은 순간에 같이 가라앉을 수 있어요. 한 사람이 먼저 \"오늘 좀 그렇지?\" 하고 꺼내 주면 좋아요.",
      },
    ],
    different: [
      {
        observation: "{A:은} {A_trait}이고, {B:은} {B_trait}이에요.",
        interplay: "한쪽은 벌써 다 표현했는데 다른 쪽은 아직 정리 중일 때가 있어요.",
        howTo: "{A:이} 조금 기다려 주고, {B:이} \"아직 생각 중이야\" 한 마디를 해주면 서로 오해가 줄어요.",
      },
    ],
    tense: [
      {
        observation: "{A:은} {A_trait}이고, {B:은} {B_trait}이에요.",
        interplay: "한쪽의 표현이 다른 쪽에게는 너무 크게, 다른 쪽의 침묵이 한쪽에게는 무관심으로 느껴질 수 있어요.",
        howTo: "감정의 크기가 아니라 \"지금 이 정도야\"라고 수치로 말해보는 것도 방법이에요. 10점 만점에 몇 점인지처럼요.",
      },
    ],
  },

  pace: {
    aligned: [
      {
        observation: "{A:은} {A_trait}이고, {B}도 {B_trait}이에요.",
        observationSame: "두 분 모두 {A_trait}이에요.",
        interplay: "결정하고 움직이는 박자가 맞아서 함께 무언가를 할 때 피로가 적어요.",
        howTo: "박자가 맞는 만큼 둘 다 놓치는 것이 같을 수 있어요. 가끔 \"우리 둘 다 빠뜨린 거 없을까?\" 하고 멈춰보면 좋아요.",
      },
    ],
    different: [
      {
        observation: "{A:은} {A_trait}이고, {B:은} {B_trait}이에요.",
        interplay: "한쪽이 이미 출발했을 때 다른 쪽은 아직 지도를 보고 있을 수 있어요.",
        howTo: "같이 움직이는 일은 출발 시각을 먼저 정해두면 서로 재촉하거나 끌려가는 느낌이 줄어요.",
      },
    ],
    tense: [
      {
        observation: "{A:은} {A_trait}이고, {B:은} {B_trait}이에요.",
        interplay: "빠른 쪽은 답답함을, 신중한 쪽은 밀려가는 느낌을 받기 쉬워요.",
        howTo: "작은 일은 빠른 쪽의 속도로, 큰 일은 신중한 쪽의 속도로 간다고 미리 정해두는 것도 방법이에요.",
      },
    ],
  },

  friction: {
    aligned: [
      {
        observation: "{A:은} {A_trait}이고, {B:은} {B_trait}이에요.",
        observationSame: "두 분은 {A_trait}이에요.",
        interplay: "크게 부딪힐 일이 적고, 부딪혀도 오래 가지 않는 편이에요.",
        howTo: "편한 만큼 서운한 걸 말하지 않고 넘기기 쉬워요. 작은 서운함도 그날 안에 꺼내는 습관이 도움이 돼요.",
      },
    ],
    different: [
      {
        observation: "{A:와} {B:은} 서로 닮은 결을 가진 사이예요.",
        interplay: "닮아서 편하지만, 같은 것을 두고 겨루기 쉬운 순간이 있어요.",
        howTo: "같은 걸 원할 때는 누가 양보할지보다 \"이번엔 네가, 다음엔 내가\"로 순서를 정해두는 것도 방법이에요.",
      },
    ],
    tense: [
      {
        observation: "{A:은} {A_trait}이고, {B:은} {B_trait}이에요.",
        interplay: "같은 상황에서 한쪽은 밀고 다른 쪽은 버티는 모양이 반복될 수 있어요.",
        howTo: "밀고 당기기가 시작되면 결론 대신 \"지금 뭐가 제일 중요해?\" 하고 서로 하나씩만 말해보면 풀리기 쉬워요.",
      },
    ],
  },
};

/** 겉장 헤드라인. 가장 부딪히는 차원의 단서 쌍으로 만든다. 없으면 가장 잘 맞는 차원으로. */
export const HEADLINES = {
  contrast: "{A_trait} 사람과 {B_trait} 사람",
  sameRhythm: "서로 다른 속도로 같은 곳을 보는 사이",
  allAligned: "설명이 길지 않아도 되는 사이",
};

export const FOOTER =
  "이 해석은 두 분의 타고난 성향을 바탕으로 한 참고 자료이며, 관계를 판단하거나 미래를 예측하지 않습니다.";

export const CONFIDENCE_NOTE = {
  mid: "{B}님의 출생시간이 더해지면 더 정밀해져요",
  low: "두 분의 출생시간이 더해지면 더 정밀해져요",
};
