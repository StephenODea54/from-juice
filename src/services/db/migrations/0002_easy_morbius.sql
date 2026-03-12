ALTER TABLE "auth"."accounts" SET SCHEMA "public";
--> statement-breakpoint
ALTER TABLE "auth"."users" SET SCHEMA "public";
--> statement-breakpoint
ALTER TABLE "auth"."verifications" SET SCHEMA "public";
--> statement-breakpoint
DROP SCHEMA "auth";
