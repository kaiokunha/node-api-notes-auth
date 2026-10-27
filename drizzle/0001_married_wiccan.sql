CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"token" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "id_user" uuid NOT NULL;--> statement-breakpoint
CREATE INDEX "users_token_idx" ON "users" USING btree ("token");--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_id_user_users_id_fk" FOREIGN KEY ("id_user") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;