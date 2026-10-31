CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mode` text NOT NULL,
	`seed` integer NOT NULL,
	`started` integer NOT NULL,
	`consumed` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sessions_user_time` ON `sessions` (`user_id`,`started`);--> statement-breakpoint
CREATE TABLE `stats` (
	`user_id` text NOT NULL,
	`mode` text NOT NULL,
	`best` integer DEFAULT 0 NOT NULL,
	`games` integer DEFAULT 0 NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`record_at` integer NOT NULL,
	`last_played` integer NOT NULL,
	PRIMARY KEY(`user_id`, `mode`)
);
--> statement-breakpoint
CREATE INDEX `leaderboard_idx` ON `stats` (`mode`,`best`,`record_at`);