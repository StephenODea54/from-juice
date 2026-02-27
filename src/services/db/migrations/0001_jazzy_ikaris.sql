ALTER TABLE "auth"."accounts" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "auth"."accounts" RENAME COLUMN "accountId" TO "account_id";--> statement-breakpoint
ALTER TABLE "auth"."accounts" RENAME COLUMN "providerId" TO "provider_id";--> statement-breakpoint
ALTER TABLE "auth"."accounts" RENAME COLUMN "accessToken" TO "access_token";--> statement-breakpoint
ALTER TABLE "auth"."accounts" RENAME COLUMN "refreshToken" TO "refresh_token";--> statement-breakpoint
ALTER TABLE "auth"."accounts" RENAME COLUMN "accessTokenExpiresAt" TO "access_token_expires_at";--> statement-breakpoint
ALTER TABLE "auth"."accounts" RENAME COLUMN "refreshTokenExpiresAt" TO "refresh_token_expires_at";--> statement-breakpoint
ALTER TABLE "auth"."accounts" RENAME COLUMN "idToken" TO "id_token";--> statement-breakpoint
ALTER TABLE "auth"."accounts" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "auth"."accounts" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "auth"."users" RENAME COLUMN "emailVerified" TO "email_verified";--> statement-breakpoint
ALTER TABLE "auth"."users" RENAME COLUMN "isOnboardingComplete" TO "is_onboarding_complete";--> statement-breakpoint
ALTER TABLE "auth"."users" RENAME COLUMN "isArchived" TO "is_archived";--> statement-breakpoint
ALTER TABLE "auth"."users" RENAME COLUMN "archivedAt" TO "archived_at";--> statement-breakpoint
ALTER TABLE "auth"."users" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "auth"."users" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "auth"."verifications" RENAME COLUMN "expiresAt" TO "expires_at";--> statement-breakpoint
ALTER TABLE "auth"."verifications" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "auth"."verifications" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "auth"."users" DROP CONSTRAINT "archived_consistency";--> statement-breakpoint
ALTER TABLE "auth"."accounts" DROP CONSTRAINT "accounts_userId_users_id_fk";
--> statement-breakpoint
DROP INDEX "auth"."accounts_user_id_idx";--> statement-breakpoint
ALTER TABLE "auth"."accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "auth"."accounts" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "auth"."users" ADD CONSTRAINT "archived_consistency" CHECK (
    ("auth"."users"."is_archived" = TRUE AND "auth"."users"."archived_at" IS NOT NULL)
    OR
    ("auth"."users"."is_archived" = FALSE AND "auth"."users"."archived_at" IS NULL)
  );