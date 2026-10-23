// 두 사람의 카드와 사이 해설을 한 번에 확인. 사용: npx tsx scripts/pair-demo.ts <seed>
import { compare, derive } from "@saibyeol/engine-saju";
import { summarizeProfile } from "../src/server/profile";
import { renderNarrative } from "../src/server/narrative/render";
let seed = Number(process.argv[2] ?? 7); const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const pad = (n: number) => String(n).padStart(2, "0");
const mk = () => { const y = 1975 + Math.floor(rnd() * 28), m = 1 + Math.floor(rnd() * 12), d = 1 + Math.floor(rnd() * 28); const t = rnd() < 0.6; return { birthDate: `${y}-${pad(m)}-${pad(d)}`, birthTime: t ? `${pad(Math.floor(rnd()*24))}:${["00","10","20","30","40","50"][Math.floor(rnd()*6)]}` : null, calendarType: "solar" as const, isLeapMonth: false, gender: (rnd() < 0.5 ? "female" : "male") as "female"|"male" }; };
const ia = mk(), ib = mk(); const a = derive(ia), b = derive(ib);
for (const [n, p, i] of [["A", a, ia], ["B", b, ib]] as const) {
  const s = summarizeProfile(p);
  console.log(`\n##### ${n}  (${i.birthDate} ${i.birthTime ?? "시간모름"} ${i.gender})`);
  console.log(`타고난 결 [${s.nature.image} · ${s.nature.season}]\n${s.nature.text}`);
  for (const l of s.lines) console.log(`${l.label}: ${l.text}`);
  console.log(`축: 순서 ${p.traits.communication.order.toFixed(2)} 속도 ${p.traits.communication.speed.toFixed(2)} 표출 ${p.traits.emotional.expression.toFixed(2)} 추진 ${p.traits.pace.drive.toFixed(2)} 일간 ${p.dayMaster.stem}${p.pillars.day.branch}`);
}
const v = compare(a, b, "friend");
const n = renderNarrative(v, "A", "B", "demo", { a: !a.hasBirthTime, b: !b.hasBirthTime });
console.log(`\n##### 관계 (friend)  신뢰도 ${v.confidence}\n헤드라인: ${n.headline}`);
for (const s of n.sections) console.log(`\n[${s.label}] ${s.levelLabel}  (A=${v.dimensions[s.dimension].clueA} B=${v.dimensions[s.dimension].clueB}${v.dimensions[s.dimension].scene ? " 장면=" + v.dimensions[s.dimension].scene : ""})\n관찰: ${s.observation}\n맞물림: ${s.interplay}\n다루는 법: ${s.howTo}`);
