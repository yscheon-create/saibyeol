// "타고난 결" — 프로필 카드의 첫 문단. 명리 개념(일간·월령·오행 편중)을 자연의 이미지로 번역한다.
// 사용자 문구에는 명리 용어를 쓰지 않는다 (CLAUDE.md 4절). 문장은 초안이며 기획자가 다듬는다.
//
// 구조: [일간 × 계절 문장 2개] + [오행 편중 보강 문장 1개] + [마무리 문장 1개]
//  - 일간(10): 그 사람이 어떤 자연물인가. 본질과 겉모습.
//  - 계절(4): 태어난 달이 그 자연물에게 어떤 환경인가. 월지로 정한다.
//  - 오행 편중: 가장 강한 오행이 주는 힘, 가장 약한 오행이 채워질 때 피어나는 것.
import type { DerivedProfile } from "@saibyeol/engine-saju";

type Stem = DerivedProfile["dayMaster"]["stem"];
type Element = DerivedProfile["dayMaster"]["element"];
type Season = "spring" | "summer" | "autumn" | "winter";

/** 월지 → 계절. 寅卯辰 봄, 巳午未 여름, 申酉戌 가을, 亥子丑 겨울 */
const SEASON_OF: Record<string, Season> = {
  寅: "spring", 卯: "spring", 辰: "spring",
  巳: "summer", 午: "summer", 未: "summer",
  申: "autumn", 酉: "autumn", 戌: "autumn",
  亥: "winter", 子: "winter", 丑: "winter",
};

const SEASON_LABEL: Record<Season, string> = { spring: "봄", summer: "여름", autumn: "가을", winter: "겨울" };

/** 일간별 자연물과 본질. [이미지, 본질 문장, 겉모습 문장] */
const DAY_MASTER: Record<Stem, { image: string; core: string; surface: string }> = {
  甲: { image: "곧게 자라는 큰 나무", core: "한번 뿌리내린 곳에서 위로 뻗어가려는 힘이 강하고, 쉽게 휘지 않습니다.", surface: "겉으로는 듬직하고 든든해 보이지만, 그만큼 꺾이는 것을 힘들어합니다." },
  乙: { image: "자라는 덩굴", core: "강한 생명력과 진득한 추진력을 지녔고, 막히면 돌아서라도 끝내 뻗어갑니다.", surface: "겉으로는 수수하고 부드러워 보일 수 있지만, 마음속에는 자신만의 길을 향한 단단한 고집이 있습니다." },
  丙: { image: "하늘 한가운데의 태양", core: "밝고 넓게 비추는 힘이 있어, 함께 있는 사람들을 환하게 만듭니다.", surface: "숨기는 것이 적고 드러내는 편이라, 때로 그 빛이 누군가에게는 눈부실 수 있습니다." },
  丁: { image: "밤을 밝히는 촛불", core: "크지 않아도 가까운 곳을 오래, 따뜻하게 비추는 힘이 있습니다.", surface: "겉으로는 조용하지만 한번 마음을 쓰면 끝까지 지키는 편입니다." },
  戊: { image: "너른 산", core: "쉽게 흔들리지 않고, 많은 것을 품고 견디는 힘이 있습니다.", surface: "말보다 자리로 보여주는 편이라, 가까운 사람일수록 그 든든함을 압니다." },
  己: { image: "곡식을 키우는 논밭", core: "무언가를 받아들여 자라게 하는 힘이 있고, 돌보는 데 능숙합니다.", surface: "겉으로는 소박해 보이지만, 안에서는 많은 것이 조용히 자라고 있습니다." },
  庚: { image: "단단한 바위와 쇠", core: "결단이 분명하고, 한번 정한 것은 끝까지 밀고 가는 힘이 있습니다.", surface: "겉으로는 강해 보이지만, 그 단단함은 지키고 싶은 것이 있어서입니다." },
  辛: { image: "다듬어진 보석", core: "섬세하고 예리해서, 작은 차이와 결을 남보다 먼저 알아챕니다.", surface: "겉으로는 차분해 보이지만, 안으로는 기준이 또렷하고 쉽게 타협하지 않습니다." },
  壬: { image: "넓고 깊은 바다", core: "품이 넓고 생각이 깊어, 한곳에 머물기보다 멀리 흐르려 합니다.", surface: "겉으로는 유연하고 자유로워 보이지만, 그 아래에는 쉽게 드러내지 않는 깊이가 있습니다." },
  癸: { image: "조용히 내리는 비", core: "스며들 듯 다가가 사람과 상황을 적시는 힘이 있고, 눈에 띄지 않게 많은 것을 바꿉니다.", surface: "겉으로는 조용하고 부드럽지만, 안에서는 끊임없이 흐르고 생각합니다." },
};

/** 일간 오행 × 계절: 그 자연물에게 그 계절은 어떤 환경인가 */
const ENVIRONMENT: Record<Element, Record<Season, string>> = {
  wood: {
    spring: "봄에 태어나 제 계절을 만난 셈이라, 자라려는 힘이 가장 자연스럽게 피어납니다.",
    summer: "한여름의 햇살 아래 자라는 셈이라, 생명력은 넘치지만 때로 스스로를 말리지 않도록 쉼이 필요합니다.",
    autumn: "가을에 태어나 다듬어지는 계절을 만난 셈이라, 자라는 힘보다 열매 맺는 힘이 두드러집니다.",
    winter: "겨울에 태어나 뿌리를 지키는 계절을 만난 셈이라, 겉보다 안으로 힘을 모으는 편입니다.",
  },
  fire: {
    spring: "봄에 태어나 땔감이 넉넉한 계절을 만난 셈이라, 밝기가 오래 이어집니다.",
    summer: "한여름에 태어나 제 계절을 만난 셈이라, 빛과 열이 가장 강하고 때로 그 힘을 조절하는 일이 과제가 됩니다.",
    autumn: "가을에 태어나 서늘해지는 계절을 만난 셈이라, 뜨겁기보다 은은하게 오래 비춥니다.",
    winter: "겨울에 태어나 가장 어두운 계절을 만난 셈이라, 그 빛이 누군가에게 더욱 귀하게 닿습니다.",
  },
  earth: {
    spring: "봄에 태어나 새싹이 뚫고 올라오는 계절을 만난 셈이라, 품되 움직임이 많은 편입니다.",
    summer: "한여름에 태어나 뜨거운 계절을 만난 셈이라, 단단하지만 마를 수 있어 곁의 물 같은 사람이 소중합니다.",
    autumn: "가을에 태어나 거두는 계절을 만난 셈이라, 쌓고 정리하는 힘이 두드러집니다.",
    winter: "겨울에 태어나 얼어붙은 계절을 만난 셈이라, 겉은 단단하고 속은 따뜻함을 기다립니다.",
  },
  metal: {
    spring: "봄에 태어나 아직 무른 계절을 만난 셈이라, 날카롭기보다 유연하게 다듬어집니다.",
    summer: "한여름에 태어나 뜨거운 불의 계절을 만난 셈이라, 단련되는 만큼 단단해지는 사람입니다.",
    autumn: "가을에 태어나 제 계절을 만난 셈이라, 결단과 기준이 가장 또렷하게 빛납니다.",
    winter: "겨울에 태어나 차가운 계절을 만난 셈이라, 예리하지만 그만큼 따뜻함을 그리워합니다.",
  },
  water: {
    spring: "봄에 태어나 얼음이 풀리는 계절을 만난 셈이라, 흐름이 막힘없이 넓어집니다.",
    summer: "한여름에 태어나 증발하기 쉬운 계절을 만난 셈이라, 깊이를 지키려면 혼자 고이는 시간이 필요합니다.",
    autumn: "가을에 태어나 맑아지는 계절을 만난 셈이라, 생각이 투명하고 멀리 봅니다.",
    winter: "겨울에 태어나 제 계절을 만난 셈이라, 깊고 조용한 힘이 가장 강합니다.",
  },
};

/** 가장 강한 오행이 주는 힘 */
const STRENGTH: Record<Element, string> = {
  wood: "어려움 앞에서 쉽게 물러서기보다 다른 길을 찾아 자라는 힘이 있습니다.",
  fire: "주변을 밝히고 움직이게 하는 힘이 있어, 함께 있으면 분위기가 살아납니다.",
  earth: "흔들리는 상황에서도 중심을 잡고 버티는 힘이 있어, 사람들이 기대게 됩니다.",
  metal: "흐트러진 것을 정리하고 결정을 내리는 힘이 있어, 막힌 일에 길을 냅니다.",
  water: "상황을 읽고 스며들 듯 적응하는 힘이 있어, 경험을 지혜로 바꾸는 데 능합니다.",
};

/** 가장 약한 오행이 채워질 때 피어나는 것 — 마무리 문장 */
const BLOOM: Record<Element, string> = {
  wood: "새로 시작할 계기와 자라날 방향이 주어질 때",
  fire: "누군가의 따뜻한 응원과 믿음이 더해질 때",
  earth: "안심하고 머물 수 있는 자리가 생길 때",
  metal: "기준을 세워주는 사람이나 분명한 결정이 곁에 있을 때",
  water: "쉬어가며 생각을 정리할 시간이 허락될 때",
};

const ELEMENT_ORDER: Element[] = ["wood", "fire", "earth", "metal", "water"];

export interface NatureDescription {
  image: string;
  season: string;
  text: string;
}

/** 파생 프로파일 → "타고난 결" 문단. 원천정보는 받지 않는다. */
export function describeNature(p: DerivedProfile): NatureDescription {
  const stem = p.dayMaster.stem;
  const element = p.dayMaster.element;
  const season = SEASON_OF[p.pillars.month.branch] ?? "spring";
  const dm = DAY_MASTER[stem];

  // 오행 편중: 일간 오행은 제외하고 가장 강한 것, 가장 약한 것
  const others = ELEMENT_ORDER.filter((e) => e !== element);
  const strongest = others.reduce((m, e) => (p.elements[e] > p.elements[m] ? e : m));
  const weakest = others.reduce((m, e) => (p.elements[e] < p.elements[m] ? e : m));

  const text = [
    `이 사람은 ${dm.image} 같은 사람입니다.`,
    dm.core,
    dm.surface,
    ENVIRONMENT[element][season],
    STRENGTH[strongest],
    `${BLOOM[weakest]}, 본래의 결을 마음껏 펼치며 자신만의 방식으로 깊고 넓게 자라는 사람입니다.`,
  ].join(" ");

  return { image: dm.image, season: SEASON_LABEL[season], text };
}
