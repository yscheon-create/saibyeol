import { describe, expect, it } from "vitest";
import { isBranchClash, isBranchCombination, isStemCombination, tenGodOf } from "../src/tables";

describe("tenGodOf: 일간 기준 십신", () => {
  // 일간 庚(양금) 기준
  it("庚 기준", () => {
    expect(tenGodOf("庚", "庚")).toBe("bijian"); // 같은 오행 같은 음양
    expect(tenGodOf("庚", "辛")).toBe("geopjae"); // 같은 오행 다른 음양
    expect(tenGodOf("庚", "壬")).toBe("siksin"); // 금생수, 양
    expect(tenGodOf("庚", "癸")).toBe("sanggwan"); // 금생수, 음
    expect(tenGodOf("庚", "甲")).toBe("pyeonjae"); // 금극목, 양
    expect(tenGodOf("庚", "乙")).toBe("jeongjae"); // 금극목, 음
    expect(tenGodOf("庚", "丙")).toBe("pyeongwan"); // 화극금, 양
    expect(tenGodOf("庚", "丁")).toBe("jeonggwan"); // 화극금, 음
    expect(tenGodOf("庚", "戊")).toBe("pyeonin"); // 토생금, 양
    expect(tenGodOf("庚", "己")).toBe("jeongin"); // 토생금, 음
  });
  // 일간 乙(음목) 기준 — 음간에서 정·편이 뒤집히지 않는지
  it("乙 기준", () => {
    expect(tenGodOf("乙", "甲")).toBe("geopjae");
    expect(tenGodOf("乙", "丁")).toBe("siksin");
    expect(tenGodOf("乙", "丙")).toBe("sanggwan");
    expect(tenGodOf("乙", "己")).toBe("pyeonjae");
    expect(tenGodOf("乙", "戊")).toBe("jeongjae");
    expect(tenGodOf("乙", "辛")).toBe("pyeongwan");
    expect(tenGodOf("乙", "庚")).toBe("jeonggwan");
    expect(tenGodOf("乙", "癸")).toBe("pyeonin");
    expect(tenGodOf("乙", "壬")).toBe("jeongin");
  });
});

describe("합·충", () => {
  it("천간합", () => {
    expect(isStemCombination("甲", "己")).toBe(true);
    expect(isStemCombination("己", "甲")).toBe(true);
    expect(isStemCombination("甲", "乙")).toBe(false);
  });
  it("지지 육합·삼합(반합)·충", () => {
    expect(isBranchCombination("子", "丑")).toBe(true); // 육합
    expect(isBranchCombination("申", "辰")).toBe(true); // 삼합 그룹 申子辰
    expect(isBranchCombination("子", "子")).toBe(false);
    expect(isBranchCombination("子", "午")).toBe(false);
    expect(isBranchClash("子", "午")).toBe(true);
    expect(isBranchClash("午", "子")).toBe(true);
    expect(isBranchClash("子", "丑")).toBe(false);
  });
});
