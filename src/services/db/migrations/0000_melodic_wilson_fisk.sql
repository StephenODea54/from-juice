CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE TABLE "auth"."accounts" (
	"userId" text NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"idToken" text,
	"password" text,
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"isOnboardingComplete" boolean DEFAULT false NOT NULL,
	"isArchived" boolean DEFAULT false NOT NULL,
	"archivedAt" timestamp with time zone,
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "archived_consistency" CHECK (
    ("auth"."users"."isArchived" = TRUE AND "auth"."users"."archivedAt" IS NOT NULL)
    OR
    ("auth"."users"."isArchived" = FALSE AND "auth"."users"."archivedAt" IS NULL)
  )
);
--> statement-breakpoint
CREATE TABLE "auth"."verifications" (
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth"."accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "auth"."accounts" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "auth"."users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "auth"."verifications" USING btree ("identifier");