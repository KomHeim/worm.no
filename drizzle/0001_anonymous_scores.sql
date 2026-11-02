CREATE TABLE "anonymous_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "nickname" text NOT NULL,
  "mode" text NOT NULL,
  "seed" integer NOT NULL,
  "started" integer NOT NULL,
  "consumed" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "anonymous_sessions_started" ON "anonymous_sessions" ("started");
--> statement-breakpoint
CREATE TABLE "runs" (
  "id" text PRIMARY KEY NOT NULL,
  "nickname" text NOT NULL,
  "mode" text NOT NULL,
  "score" integer NOT NULL,
  "finished_at" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "runs_leaderboard" ON "runs" ("mode","score","finished_at");
