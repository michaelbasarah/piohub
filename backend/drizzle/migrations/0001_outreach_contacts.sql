CREATE TABLE "outreach_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"channel" varchar(50),
	"note" text,
	"has_idea" boolean DEFAULT false NOT NULL,
	"ref_code" varchar(16) NOT NULL,
	"signed_up_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "outreach_contacts_ref_code_unique" UNIQUE("ref_code")
);
