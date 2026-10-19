// 원천정보(SourceData) 접근은 이 파일에서만 한다. (CLAUDE.md 3절, docs/data-model.md 접근 규칙)
// 다른 모듈은 `sourceData` 테이블을 import하거나 조회하지 않는다. test/source-data-isolation.test.ts 가 이를 검사한다.
import { derive, type SourceDataInput } from "@saibyeol/engine-saju";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { derivedProfiles, sourceData } from "@/db/schema";
import { revokeAllEdgesOf } from "./edges";

export const sourceDataSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "생년월일은 YYYY-MM-DD 형식이어야 해요"),
  calendarType: z.enum(["solar", "lunar"]),
  isLeapMonth: z.boolean().default(false),
  birthTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "출생시간은 HH:mm 형식이어야 해요")
    .nullable(),
  gender: z.enum(["female", "male"]),
});
export type SourceDataForm = z.infer<typeof sourceDataSchema>;

/** 본인 원천정보 조회. 본인 화면(수정 폼)에서만 쓴다. */
export async function getOwnSourceData(userId: string): Promise<SourceDataForm | null> {
  const row = await db.query.sourceData.findFirst({ where: eq(sourceData.userId, userId) });
  if (!row) return null;
  return {
    birthDate: row.birthDate,
    calendarType: row.calendarType,
    isLeapMonth: row.isLeapMonth,
    birthTime: row.birthTime,
    gender: row.gender,
  };
}

/**
 * 본인 원천정보 저장 + 파생 프로파일 재계산.
 * 원천정보가 바뀌면 이 사용자가 속한 활성 관계의 결과도 다시 계산되어야 한다. 첫 버전은 단순하게 관계를 그대로 두고,
 * 결과 조회 시 엔진 버전·프로파일 계산 시각을 비교해 재계산한다(edges.ts ensureResults 참고).
 */
export async function saveOwnSourceData(userId: string, form: SourceDataForm): Promise<void> {
  const input: SourceDataInput = {
    birthDate: form.birthDate,
    calendarType: form.calendarType,
    isLeapMonth: form.calendarType === "lunar" ? form.isLeapMonth : false,
    birthTime: form.birthTime,
    gender: form.gender,
  };
  // 엔진이 입력을 거부하면(잘못된 날짜 등) 여기서 예외가 나고 아무것도 저장되지 않는다
  const profile = derive(input);

  await db.transaction(async (tx) => {
    await tx
      .insert(sourceData)
      .values({ userId, ...input, updatedAt: new Date() })
      .onConflictDoUpdate({ target: sourceData.userId, set: { ...input, updatedAt: new Date() } });
    await tx
      .insert(derivedProfiles)
      .values({
        userId,
        engine: profile.engine,
        engineVersion: profile.engineVersion,
        hasBirthTime: profile.hasBirthTime,
        data: profile,
        computedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: derivedProfiles.userId,
        set: {
          engine: profile.engine,
          engineVersion: profile.engineVersion,
          hasBirthTime: profile.hasBirthTime,
          data: profile,
          computedAt: new Date(),
        },
      });
  });
}

/** 본인 원천정보 삭제. 파생 프로파일 삭제 → 모든 Edge revoked 로 연쇄한다. */
export async function deleteOwnSourceData(userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(sourceData).where(eq(sourceData.userId, userId));
    await tx.delete(derivedProfiles).where(eq(derivedProfiles.userId, userId));
    await revokeAllEdgesOf(tx, userId);
  });
}
