// 끝에서 끝까지: A 입력 → 상대 등록 → B 입력·수락 → 결과. 로컬 Postgres(DATABASE_URL)가 필요하다.
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { activateEdge, createCandidate, getEdgeResult, getInvitePreview, listEdgesFor, revokeEdge } from "../src/server/edges";
import { getDerivedProfile } from "../src/server/profile";
import { deleteOwnSourceData, getOwnSourceData, saveOwnSourceData } from "../src/server/source-data";

const run = process.env.DATABASE_URL ? describe : describe.skip;

async function mkUser(name: string) {
  const [u] = await db.insert(users).values({ email: `${name}-${Date.now()}@test.local`, name, displayName: name }).returning();
  return u!.id;
}

run("관계 흐름 (통합)", () => {
  let a = "", b = "", c = "";
  beforeAll(async () => { a = await mkUser("지은"); b = await mkUser("민수"); c = await mkUser("제3자"); });
  afterAll(async () => { for (const id of [a, b, c]) await db.delete(users).where(eq(users.id, id)); });

  it("A가 입력하면 파생 프로파일이 생기고, 원천정보는 본인 조회로만 나온다", async () => {
    await saveOwnSourceData(a, { birthDate: "1990-05-15", calendarType: "solar", isLeapMonth: false, birthTime: "14:30", gender: "female" });
    const p = await getDerivedProfile(a);
    expect(p?.hasBirthTime).toBe(true);
    expect(p?.dayMaster.stem).toBe("庚");
    const own = await getOwnSourceData(a);
    expect(own?.birthDate).toBe("1990-05-15");
  });

  it("상대 등록 → candidate, 초대 미리보기에는 원천정보가 없다", async () => {
    const edge = await createCandidate(a, "민수", ["friend", "coworker"]);
    expect(edge.state).toBe("candidate");
    expect(edge.inviteToken.length).toBeGreaterThanOrEqual(22);
    const pv = await getInvitePreview(edge.inviteToken);
    expect(pv?.inviterName).toBe("지은");
    expect(JSON.stringify(pv)).not.toMatch(/1990/);
    // B에게는 candidate가 보이지 않고, A에게는 보인다
    expect((await listEdgesFor(b)).length).toBe(0);
    expect((await listEdgesFor(a))[0]?.state).toBe("candidate");
  });

  it("B가 입력 전에는 수락 불가, 입력 후 수락하면 active + 유형별 결과 2개", async () => {
    const token = (await listEdgesFor(a))[0]!.inviteToken!;
    await expect(activateEdge(token, b)).rejects.toThrow(/본인 정보/);
    await expect(activateEdge(token, a)).rejects.toThrow(/자기 자신/);

    await saveOwnSourceData(b, { birthDate: "1988-12-03", calendarType: "solar", isLeapMonth: false, birthTime: null, gender: "male" });
    const { edgeId } = await activateEdge(token, b);

    const viewA = await getEdgeResult(edgeId, a);
    const viewB = await getEdgeResult(edgeId, b);
    expect(viewA?.state).toBe("active");
    expect(Object.keys(viewA!.results).sort()).toEqual(["coworker", "friend"]);
    expect(viewA!.results.friend!.sections).toHaveLength(4);
    expect(viewA!.results.friend!.confidenceNote).toMatch(/출생시간/);
    // 양쪽이 같은 해설을 본다
    expect(viewB!.results.friend!.headline).toBe(viewA!.results.friend!.headline);
    // 결과 어디에도 원천정보가 없다
    expect(JSON.stringify(viewA)).not.toMatch(/1990|1988|14:30/);
    // 제3자는 볼 수 없다
    expect(await getEdgeResult(edgeId, c)).toBeNull();
    // 같은 토큰으로 제3자가 수락하려 하면 거부
    await saveOwnSourceData(c, { birthDate: "1995-01-01", calendarType: "solar", isLeapMonth: false, birthTime: null, gender: "female" });
    await expect(activateEdge(token, c)).rejects.toThrow(/이미 다른 분/);
  });

  it("원천정보 삭제는 Edge를 revoked로 연쇄하고 결과를 지운다", async () => {
    const edgeId = (await listEdgesFor(a))[0]!.id;
    await deleteOwnSourceData(b);
    const view = await getEdgeResult(edgeId, a);
    expect(view?.state).toBe("revoked");
    expect(Object.keys(view!.results)).toHaveLength(0);
    expect(await getDerivedProfile(b)).toBeNull();
  });

  it("revokeEdge는 당사자만 가능하다", async () => {
    const edge = await createCandidate(a, "누군가", ["family"]);
    await expect(revokeEdge(edge.id, c)).rejects.toThrow(/권한/);
    await revokeEdge(edge.id, a);
    expect((await getEdgeResult(edge.id, a))?.state).toBe("revoked");
  });
});
