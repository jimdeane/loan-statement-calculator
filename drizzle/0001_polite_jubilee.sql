PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`password_iterations` integer DEFAULT 100000 NOT NULL,
	`must_change_password` integer DEFAULT true NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`scopes` text DEFAULT '["loan:read","loan:export"]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_login_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "username", "display_name", "role", "password_hash", "password_salt", "password_iterations", "must_change_password", "is_active", "scopes", "created_at", "updated_at", "last_login_at") SELECT "id", "username", "display_name", "role", "password_hash", "password_salt", "password_iterations", "must_change_password", "is_active", "scopes", "created_at", "updated_at", "last_login_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);