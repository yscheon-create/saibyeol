import { describe, expect, it } from "vitest";
import { axis, derive } from "../src/derive";
import type { SourceDataInput } from "../src/types";

const person = (birthDate: string, birthTime: string | null): SourceDataInput => ({
  birthDate, birthTime, calendarType: "solar", isLeapMonth: false, gender: "female",
});

describe("axis: 두 묶음 → 0~1", () => {
  it("둘 다 0이면 중립 0.5", () => expect(axis(0, 0)).toBe(0.5));
  it("한쪽만 있어도 완충값 때문에 극단값이 아니다", () => {
    expect(axis(3, 0)).toBeCloseTo(3.5 / 4, 5);
    expect(axis(0, 3)).toBeCloseTo(0.5 / 4, 5);
  });
  it("대칭", () => expect(axis(2, 5) + axis(5, 2)).toBeCloseTo(1, 10));
});

describe("derive: 庚午 辛巳 庚辰 癸未 (1990-05-15 14:30)", () => {
  const p = derive(person("1990-05-15", "14:30"));

  it("일간 庚 양금", () => {
    expect(p.dayMaster).toEqual({ stem: "庚", element: "metal", polarity: "yang" });
    expect(p.hasBirthTime).toBe(true);
    expect(p.engine).toBe("saju");
  });

  it("십신 가중 분포 (월지 2.0, 일지 1.5, 그 외 1.0, 일간 제외)", () => {
    // 年干庚=비견1 · 年支午(丁)=정관1 · 月干辛=겁재1 · 月支巳(丙)=편관2 · 日支辰(戊)=편인1.5 · 時干癸=상관1 · 時支未(己)=정인1
    expect(p.tenGods).toEqual({
      bijian: 1, geopjae: 1, siksin: 0, sanggwan: 1, pyeonjae: 0,
      jeongjae: 0, pyeongwan: 2, jeonggwan: 1, pyeonin: 1.5, jeongin: 1,
    });
  });

  it("오행 가중 분포 (일간 포함)", () => {
    expect(p.elements).toEqual({ wood: 0, fire: 3, earth: 2.5, metal: 3, water: 1 });
  });

  it("공통 4차원 축 값이 규칙대로 계산된다", () => {
    // 순서축: (상관1+편재0) vs (식신0+정인1) = 0.5, 양간 +0.1
    expect(p.traits.communication.order).toBeCloseTo(0.6, 5);
    // 속도축: (비견1+겁재1+상관1=3) vs (편인1.5+정인1+정관1=3.5)
    expect(p.traits.communication.speed).toBeCloseTo(3.5 / 7.5, 5);
    // 표출축: (화3+상관1+겁재1+금1.5=6.5) vs (수1+정인1+편인1.5+금1.5=5)
    expect(p.traits.emotional.expression).toBeCloseTo(7 / 12.5, 5);
    // 추진축: (비견1+겁재1+상관1+편관2=5) vs (정인1+정관1+정재0=2)
    expect(p.traits.pace.drive).toBeCloseTo(5.5 / 8, 5);
    expect(p.traits.friction).toEqual({ dayStem: "庚", dayBranch: "辰", element: "metal" });
  });
});

describe("derive: 출생시간 없음", () => {
  it("시주 없이 여섯 글자로 계산하고 hasBirthTime=false", () => {
    const p = derive(person("1990-05-15", null));
    expect(p.hasBirthTime).toBe(false);
    expect(p.pillars.hour).toBeNull();
    // 시주(癸·未) 몫이 빠진다: 상관 0, 정인 0
    expect(p.tenGods.sanggwan).toBe(0);
    expect(p.tenGods.jeongin).toBe(0);
    expect(p.elements.water).toBe(0);
  });
});

describe("derive: 결정성", () => {
  it("같은 입력이면 같은 출력", () => {
    const a = derive(person("1985-11-02", "07:10"));
    const b = derive(person("1985-11-02", "07:10"));
    expect(a).toEqual(b);
  });
});
