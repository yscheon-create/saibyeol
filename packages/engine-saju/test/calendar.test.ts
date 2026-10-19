import { describe, expect, it } from "vitest";
import { toPillars } from "../src/calendar.js";
import type { SourceDataInput } from "../src/types.js";

const solar = (birthDate: string, birthTime: string | null): SourceDataInput => ({
  birthDate, birthTime, calendarType: "solar", isLeapMonth: false, gender: "female",
});
const gz = (p: { stem: string; branch: string } | null) => (p ? p.stem + p.branch : null);

describe("toPillars: 알려진 명식 대조", () => {
  it("1990-05-15 14:30 → 庚午 辛巳 庚辰 癸未", () => {
    const p = toPillars(solar("1990-05-15", "14:30"));
    expect([gz(p.year), gz(p.month), gz(p.day), gz(p.hour)]).toEqual(["庚午", "辛巳", "庚辰", "癸未"]);
  });

  it("2000-01-01 00:00 → 己卯 丙子 戊午 壬子 (입춘 전이므로 전년 己卯)", () => {
    const p = toPillars(solar("2000-01-01", "00:00"));
    expect([gz(p.year), gz(p.month), gz(p.day), gz(p.hour)]).toEqual(["己卯", "丙子", "戊午", "壬子"]);
  });

  it("음력 1990-04-21 = 양력 1990-05-15 와 같은 명식", () => {
    const fromLunar = toPillars({
      birthDate: "1990-04-21", birthTime: "14:30", calendarType: "lunar", isLeapMonth: false, gender: "male",
    });
    const fromSolar = toPillars(solar("1990-05-15", "14:30"));
    expect(fromLunar).toEqual(fromSolar);
  });

  it("음력 윤달: 2023년 윤2월 10일 = 양력 2023-03-31", () => {
    const leap = toPillars({
      birthDate: "2023-02-10", birthTime: "10:00", calendarType: "lunar", isLeapMonth: true, gender: "female",
    });
    const plain = toPillars(solar("2023-03-31", "10:00"));
    expect(leap).toEqual(plain);
  });
});

describe("toPillars: 한국 표준시 절기 보정", () => {
  // 2024년 입춘은 한국 표준시 2월 4일 17:27 (한국천문연구원). 중국 표준시로는 16:27.
  // 보정이 없으면 17:00 출생이 이미 甲辰년으로 잘못 계산된다.
  it("2024-02-04 17:00 KST 는 아직 癸卯년 乙丑월", () => {
    const p = toPillars(solar("2024-02-04", "17:00"));
    expect([gz(p.year), gz(p.month)]).toEqual(["癸卯", "乙丑"]);
  });
  it("2024-02-04 18:00 KST 는 甲辰년 丙寅월", () => {
    const p = toPillars(solar("2024-02-04", "18:00"));
    expect([gz(p.year), gz(p.month)]).toEqual(["甲辰", "丙寅"]);
  });
});

describe("toPillars: 일주 경계와 출생시간 없음", () => {
  it("정자시법: 23:30 출생은 다음 날 일주, 시주는 子時", () => {
    const late = toPillars(solar("1990-05-15", "23:30"));
    const nextDay = toPillars(solar("1990-05-16", "12:00"));
    expect(gz(late.day)).toBe(gz(nextDay.day)); // 辛巳
    expect(late.hour?.branch).toBe("子");
  });

  it("출생시간 없음: 시주는 null, 나머지 세 기둥은 정오 기준", () => {
    const p = toPillars(solar("1990-05-15", null));
    expect(p.hour).toBeNull();
    expect([gz(p.year), gz(p.month), gz(p.day)]).toEqual(["庚午", "辛巳", "庚辰"]);
  });

  it("잘못된 형식은 명확한 오류", () => {
    expect(() => toPillars(solar("1990/05/15", null))).toThrow(/birthDate/);
    expect(() => toPillars(solar("1990-05-15", "25:00"))).toThrow(/birthTime/);
  });
});
