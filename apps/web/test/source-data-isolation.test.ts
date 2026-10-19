// SourceData 격리 검사 (CLAUDE.md 3절). sourceData 테이블을 건드리는 코드는 src/server/source-data.ts 뿐이어야 한다.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "src");
const ALLOWED = new Set(["server/source-data.ts", "db/schema.ts"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

describe("SourceData 격리", () => {
  it("sourceData 테이블은 허용된 파일에서만 참조된다", () => {
    const offenders: string[] = [];
    for (const file of walk(ROOT)) {
      const rel = relative(ROOT, file).replaceAll("\\", "/");
      if (ALLOWED.has(rel)) continue;
      const src = readFileSync(file, "utf8");
      // 테이블 심볼 또는 원천 컬럼 직접 접근
      if (/\bsourceData\b/.test(src) || /\bbirthDate\b|\bbirthTime\b/.test(src.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, ""))) {
        // 폼 컴포넌트와 액션은 사용자 입력을 받으므로 필드 이름을 쓸 수밖에 없다 — 읽기(DB 조회)가 아님
        if (/^(components\/SourceDataForm\.tsx|app\/actions\.ts)$/.test(rel)) continue;
        offenders.push(rel);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("공유 카드·해설 렌더러는 엔진 DerivedProfile 전체를 받지 않는다", () => {
    const render = readFileSync(join(ROOT, "server/narrative/render.ts"), "utf8");
    expect(render).not.toMatch(/DerivedProfile/);
  });
});
