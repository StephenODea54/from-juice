CREATE TABLE "children" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"parent_id" text NOT NULL,
	"name" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"delivery_date" date,
	"delivery_email" text,
	"archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "dob_not_in_future" CHECK ("children"."date_of_birth" <= CURRENT_DATE),
	CONSTRAINT "delivery_after_birth" CHECK ("children"."delivery_date" IS NULL OR "children"."delivery_date" > "children"."date_of_birth"),
	CONSTRAINT "delivery_in_future" CHECK ("children"."delivery_date" IS NULL OR "children"."delivery_date" > CURRENT_DATE),
	CONSTRAINT "archived_consistency" CHECK (
    ("children"."archived" = TRUE AND "children"."archived_at" IS NOT NULL)
    OR
    ("children"."archived" = FALSE AND "children"."archived_at" IS NULL)
  )
);
--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "children_parent_id_idx" ON "children" USING btree ("parent_id");