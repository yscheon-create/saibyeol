// 엔진 동작 확인용. 사용: npm run demo -- 1990-05-15 14:30 1988-12-03 없음
// 화면이 생기기 전까지 결과를 눈으로 보는 용도이며, 사용자 문구가 아니다.
import { compare, derive } from "../src/index.js";

const [dateA, timeA, dateB, timeB] = process.argv.slice(2);
if (!dateA || !dateB) {
  console.log("사용: npm run demo -- <A 생년월일> <A 시간|없음> <B 생년월일> <B 시간|없음>");
  process.exit(1);
}
const t = (s: string | undefined) => (!s || s === "없음" ? null : s);
const a = derive({ birthDate: dateA, birthTime: t(timeA), calendarType: "solar", isLeapMonth: false, gender: "female" });
const b = derive({ birthDate: dateB, birthTime: t(timeB), calendarType: "solar", isLeapMonth: false, gender: "male" });
const gz = (p: { stem: string; branch: string } | null) => (p ? p.stem + p.branch : "--");
const show = (name: string, p: typeof a) =>
  console.log(`${name}: ${gz(p.pillars.year)} ${gz(p.pillars.month)} ${gz(p.pillars.day)} ${gz(p.pillars.hour)}  ` +
    `순서 ${p.traits.communication.order.toFixed(2)} 속도 ${p.traits.communication.speed.toFixed(2)} ` +
    `표출 ${p.traits.emotional.expression.toFixed(2)} 추진 ${p.traits.pace.drive.toFixed(2)}`);
show("A", a); show("B", b);
const r = compare(a, b, "friend");
console.log(`신뢰도: ${r.confidence}`);
for (const d of Object.values(r.dimensions)) {
  console.log(`  ${d.dimension.padEnd(14)} ${d.score.toFixed(2)}  ${d.level.padEnd(9)} A=${d.clueA} B=${d.clueB}${d.scene ? " 장면=" + d.scene : ""}`);
}
