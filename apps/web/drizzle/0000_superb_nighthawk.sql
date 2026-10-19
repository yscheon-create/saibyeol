CREATE TYPE "public"."calendar_type" AS ENUM('solar', 'lunar');--> statement-breakpoint
CREATE TYPE "public"."confidence" AS ENUM('high', 'mid', 'low');--> statement-breakpoint
CREATE TYPE "public"."edge_state" AS ENUM('candidate', 'active', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('female', 'male');--> statement-breakpoint
CREATE TYPE "public"."relationship_type" AS ENUM('family', 'friend', 'romance', 'coworker');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "compatibility_vector" (
	"edge_id" text NOT NULL,
	"relationship_type" "relationship_type" NOT NULL,
	"dimensions" jsonb NOT NULL,
	"confidence" "confidence" NOT NULL,
	"hidden_dimensions" text[] DEFAULT '{}' NOT NULL,
	"engine_version" text NOT NULL,
	"computed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compatibility_vector_edge_id_relationship_type_pk" PRIMARY KEY("edge_id","relationship_type")
);
--> statement-breakpoint
CREATE TABLE "derived_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"engine" text NOT NULL,
	"engine_version" text NOT NULL,
	"has_birth_time" boolean NOT NULL,
	"data" jsonb NOT NULL,
	"computed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "narrative" (
	"edge_id" text NOT NULL,
	"relationship_type" "relationship_type" NOT NULL,
	"headline" text NOT NULL,
	"best_dimension" text NOT NULL,
	"friction_dimension" text NOT NULL,
	"sections" jsonb NOT NULL,
	"shareable_excerpt" jsonb NOT NULL,
	"template_version" text NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "narrative_edge_id_relationship_type_pk" PRIMARY KEY("edge_id","relationship_type")
);
--> statement-breakpoint
CREATE TABLE "relationship_edge" (
	"id" text PRIMARY KEY NOT NULL,
	"user_a_id" text NOT NULL,
	"user_b_id" text,
	"counterpart_label" text NOT NULL,
	"state" "edge_state" DEFAULT 'candidate' NOT NULL,
	"types" "relationship_type"[] NOT NULL,
	"invite_token" text NOT NULL,
	"invite_expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"activated_at" timestamp,
	"revoked_at" timestamp,
	"revoked_by" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_data" (
	"user_id" text PRIMARY KEY NOT NULL,
	"birth_date" text NOT NULL,
	"calendar_type" "calendar_type" NOT NULL,
	"is_leap_month" boolean DEFAULT false NOT NULL,
	"birth_time" text,
	"gender" "gender" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"displayName" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compatibility_vector" ADD CONSTRAINT "compatibility_vector_edge_id_relationship_edge_id_fk" FOREIGN KEY ("edge_id") REFERENCES "public"."relationship_edge"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "derived_profile" ADD CONSTRAINT "derived_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "narrative" ADD CONSTRAINT "narrative_edge_id_relationship_edge_id_fk" FOREIGN KEY ("edge_id") REFERENCES "public"."relationship_edge"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_edge" ADD CONSTRAINT "relationship_edge_user_a_id_user_id_fk" FOREIGN KEY ("user_a_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationship_edge" ADD CONSTRAINT "relationship_edge_user_b_id_user_id_fk" FOREIGN KEY ("user_b_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_data" ADD CONSTRAINT "source_data_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "relationship_edge_invite_token_idx" ON "relationship_edge" USING btree ("invite_token");--> statement-breakpoint
CREATE INDEX "relationship_edge_user_a_idx" ON "relationship_edge" USING btree ("user_a_id");--> statement-breakpoint
CREATE INDEX "relationship_edge_user_b_idx" ON "relationship_edge" USING btree ("user_b_id");