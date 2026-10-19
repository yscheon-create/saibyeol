// 생년월일시(한국 표준시) → 사주 네 기둥.
// 천문 계산(절기, 음력 변환)은 lunar-typescript에 맡기고, 한국 기준으로 맞추는 보정만 여기서 한다.
//
// 알려진 관례와 한계 (docs/dimensions.md "만세력 관례" 참고):
// - 절기 시각: 라이브러리는 중국 표준시(UTC+8) 기준. 한국 표준시(UTC+9)로 맞추기 위해
//   연주·월주 판정에는 입력 시각에서 1시간을 뺀 시각을 쓴다.
// - 일주 경계: 정자시법. 23:00부터 다음 날 일주로 본다 (라이브러리 sect=1).
// - 출생시간 모름: 정오(12:00)로 간주해 연·월·일주를 구하고 시주는 null.
// - 진태양시(경도 보정, 약 -30분)는 첫 버전에서 적용하지 않는다.
import { Lunar, Solar } from "lunar-typescript";
import type { Branch, Pillar, Pillars, SourceDataInput, Stem } from "./types.js";

const KST_MINUS_CST_HOURS = 1;
const NOON = { hour: 12, minute: 0 };

function parseDate(ymd: string): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) throw new Error(`birthDate 형식 오류: ${ymd} (YYYY-MM-DD)`);
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function parseTime(hm: string): { hour: number; minute: number } {
  const match = /^(\d{2}):(\d{2})$/.exec(hm);
  if (!match) throw new Error(`birthTime 형식 오류: ${hm} (HH:mm)`);
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) throw new Error(`birthTime 범위 오류: ${hm}`);
  return { hour, minute };
}

function toPillar(ganzhi: string): Pillar {
  return { stem: ganzhi.charAt(0) as Stem, branch: ganzhi.charAt(1) as Branch };
}

/** 입력(양력 또는 음력)을 양력 연월일로 통일한다 */
function toSolarYmd(input: SourceDataInput): { y: number; m: number; d: number } {
  const { y, m, d } = parseDate(input.birthDate);
  if (input.calendarType === "solar") return { y, m, d };
  // lunar-typescript는 윤달을 음수 월로 표현한다
  const lunar = Lunar.fromYmd(y, input.isLeapMonth ? -m : m, d);
  const solar = lunar.getSolar();
  return { y: solar.getYear(), m: solar.getMonth(), d: solar.getDay() };
}

function eightCharAt(y: number, m: number, d: number, hour: number, minute: number) {
  const ec = Solar.fromYmdHms(y, m, d, hour, minute, 0).getLunar().getEightChar();
  ec.setSect(1); // 정자시법: 23시부터 다음 날 일주
  return ec;
}

/** 생년월일시 → 네 기둥 */
export function toPillars(input: SourceDataInput): Pillars {
  const { y, m, d } = toSolarYmd(input);
  const hasTime = input.birthTime !== null;
  const { hour, minute } = hasTime ? parseTime(input.birthTime as string) : NOON;

  // 일주·시주: 입력 시각 그대로
  const exact = eightCharAt(y, m, d, hour, minute);

  // 연주·월주: 절기 비교를 한국 표준시로 맞추기 위해 1시간을 뺀 시각
  const shifted = Solar.fromYmdHms(y, m, d, hour, minute, 0)
    .nextHour(-KST_MINUS_CST_HOURS);
  const forTerms = shifted.getLunar().getEightChar();

  return {
    year: toPillar(forTerms.getYear()),
    month: toPillar(forTerms.getMonth()),
    day: toPillar(exact.getDay()),
    hour: hasTime ? toPillar(exact.getTime()) : null,
  };
}
