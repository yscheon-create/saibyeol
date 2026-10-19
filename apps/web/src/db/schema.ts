// 사이별 데이터 모델 (Drizzle ORM, PostgreSQL). 원본은 docs/data-model.md.
// 바꾸기 전에 그 문서를 먼저 고치고 소유자에게 알린다. 변경 후에는 `npm run db:generate` 로 마이그레이션 파일을 만든다.
import { relations } from "drizzle-orm";
import {
  boolean, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ───────────────────────── 인증 (Auth.js 표준 테이블) ─────────────────────────

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  /** 상대에게 보이는 호칭. 가입 직후에는 카카오 닉네임을 복사한다. */
  displayName: text("displayName"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deletedAt", { mode: "date" }),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ───────────────────────── 원천정보 (비공개) ─────────────────────────

export const calendarTypeEnum = pgEnum("calendar_type", ["solar", "lunar"]);
export const genderEnum = pgEnum("gender", ["female", "male"]);

/** 생년월일시 등 개인 원천정보. 본인 세션과 derive() 로더만 읽는다 (docs/data-model.md 접근 규칙). */
export const sourceData = pgTable("source_data", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  birthDate: text("birth_date").notNull(), // YYYY-MM-DD, calendarType 기준
  calendarType: calendarTypeEnum("calendar_type").notNull(),
  isLeapMonth: boolean("is_leap_month").notNull().default(false),
  birthTime: text("birth_time"), // HH:mm, null = 모름
  gender: genderEnum("gender").notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ───────────────────────── 파생 프로파일 ─────────────────────────

export const derivedProfiles = pgTable("derived_profile", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  engine: text("engine").notNull(), // "saju"
  engineVersion: text("engine_version").notNull(),
  hasBirthTime: boolean("has_birth_time").notNull(),
  /** 엔진이 돌려준 DerivedProfile 전체. 사용자 화면에는 traits와 요약만 쓴다. */
  data: jsonb("data").notNull(),
  computedAt: timestamp("computed_at", { mode: "date" }).notNull().defaultNow(),
});

// ───────────────────────── 관계 ─────────────────────────

export const edgeStateEnum = pgEnum("edge_state", ["candidate", "active", "revoked"]);
export const relationshipTypeEnum = pgEnum("relationship_type", ["family", "friend", "romance", "coworker"]);
export const confidenceEnum = pgEnum("confidence", ["high", "mid", "low"]);

export const relationshipEdges = pgTable(
  "relationship_edge",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userAId: text("user_a_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    userBId: text("user_b_id").references(() => users.id, { onDelete: "set null" }),
    /** A가 B를 부르는 이름. B 가입 전부터 존재한다. */
    counterpartLabel: text("counterpart_label").notNull(),
    state: edgeStateEnum("state").notNull().default("candidate"),
    types: relationshipTypeEnum("types").array().notNull(),
    inviteToken: text("invite_token").notNull(),
    inviteExpiresAt: timestamp("invite_expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    activatedAt: timestamp("activated_at", { mode: "date" }),
    revokedAt: timestamp("revoked_at", { mode: "date" }),
    revokedBy: text("revoked_by"),
  },
  (t) => [
    uniqueIndex("relationship_edge_invite_token_idx").on(t.inviteToken),
    index("relationship_edge_user_a_idx").on(t.userAId),
    index("relationship_edge_user_b_idx").on(t.userBId),
  ],
);

export const compatibilityVectors = pgTable(
  "compatibility_vector",
  {
    edgeId: text("edge_id").notNull().references(() => relationshipEdges.id, { onDelete: "cascade" }),
    relationshipType: relationshipTypeEnum("relationship_type").notNull(),
    /** 엔진 CompatibilityVector.dimensions 전체 */
    dimensions: jsonb("dimensions").notNull(),
    confidence: confidenceEnum("confidence").notNull(),
    hiddenDimensions: text("hidden_dimensions").array().notNull().default([]),
    engineVersion: text("engine_version").notNull(),
    computedAt: timestamp("computed_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.edgeId, t.relationshipType] })],
);

export const narratives = pgTable(
  "narrative",
  {
    edgeId: text("edge_id").notNull().references(() => relationshipEdges.id, { onDelete: "cascade" }),
    relationshipType: relationshipTypeEnum("relationship_type").notNull(),
    headline: text("headline").notNull(),
    bestDimension: text("best_dimension").notNull(),
    frictionDimension: text("friction_dimension").notNull(),
    /** [{ dimension, level, observation, interplay, howTo }] */
    sections: jsonb("sections").notNull(),
    /** 겉장 전체. 공유 카드 생성은 이것만 받는다. */
    shareableExcerpt: jsonb("shareable_excerpt").notNull(),
    templateVersion: text("template_version").notNull(),
    generatedAt: timestamp("generated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.edgeId, t.relationshipType] })],
);

// ───────────────────────── 관계 정의 (쿼리 편의) ─────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  derivedProfile: one(derivedProfiles, { fields: [users.id], references: [derivedProfiles.userId] }),
  edgesAsA: many(relationshipEdges, { relationName: "edgeUserA" }),
  edgesAsB: many(relationshipEdges, { relationName: "edgeUserB" }),
}));

export const relationshipEdgesRelations = relations(relationshipEdges, ({ one, many }) => ({
  userA: one(users, { fields: [relationshipEdges.userAId], references: [users.id], relationName: "edgeUserA" }),
  userB: one(users, { fields: [relationshipEdges.userBId], references: [users.id], relationName: "edgeUserB" }),
  vectors: many(compatibilityVectors),
  narratives: many(narratives),
}));

export const compatibilityVectorsRelations = relations(compatibilityVectors, ({ one }) => ({
  edge: one(relationshipEdges, { fields: [compatibilityVectors.edgeId], references: [relationshipEdges.id] }),
}));

export const narrativesRelations = relations(narratives, ({ one }) => ({
  edge: one(relationshipEdges, { fields: [narratives.edgeId], references: [relationshipEdges.id] }),
}));
