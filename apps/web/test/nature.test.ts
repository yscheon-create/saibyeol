import { derive } from "@saibyeol/engine-saju";
import { describe, expect, it } from "vitest";
import { describeNature } from "../src/server/narrative/nature";

const p = (d: string, t: string | null) => derive({ birthDate: d, birthTime: t, calendarType: "solar", isLeapMonth: false, gender: "female" });

describe("타고난 결", () => {
  it("일간·계절·오행 편중이 문단에 반영된다", () => {
    const n = describeNature(p("1990-05-15", "14:30")); // 庚 일간, 巳월
    expect(n.image).toBe("단단한 바위와 쇠");
    expect(n.season).toBe("여름");
    expect(n.text).toMatch(/^이 사람은 단단한 바위와 쇠 같은 사람입니다\./);
    expect(n.text.split(". ").length).toBeGreaterThanOrEqual(5);
  });
  it("같은 입력이면 같은 문단, 다른 일간이면 다른 이미지", () => {
    expect(describeNature(p("1988-12-03", null))).toEqual(describeNature(p("1988-12-03", null)));
    expect(describeNature(p("1988-12-03", null)).image).not.toBe(describeNature(p("1990-05-15", null)).image);
  });
  it("명리 용어와 원천정보가 문구에 없다", () => {
    const n = describeNature(p("1983-03-02", null));
    expect(n.text).not.toMatch(/일간|월령|오행|십신|사주|1983|己|壬/);
  });
});
