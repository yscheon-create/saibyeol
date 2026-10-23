// 프로필 카드 문장 확인용. npx tsx scripts/card-demo.ts 1988-12-03 없음
import { derive } from "@saibyeol/engine-saju";
import { summarizeProfile } from "../src/server/profile";
const [d, t] = process.argv.slice(2);
const s = summarizeProfile(derive({ birthDate: d ?? "1988-12-03", birthTime: !t || t === "없음" ? null : t, calendarType: "solar", isLeapMonth: false, gender: "female" }));
console.log(`타고난 결 (${s.nature.image} · ${s.nature.season})\n${s.nature.text}\n`);
for (const l of s.lines) console.log(`${l.label}\n${l.text}\n`);
