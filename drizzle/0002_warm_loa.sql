CREATE TABLE `changelog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version` varchar(32) NOT NULL,
	`title` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`type` enum('feature','fix','improvement','breaking') NOT NULL DEFAULT 'feature',
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `changelog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`theme` enum('light','dark','system') NOT NULL DEFAULT 'system',
	`language` varchar(8) NOT NULL DEFAULT 'en',
	`emailNotifications` boolean NOT NULL DEFAULT true,
	`marketingEmails` boolean NOT NULL DEFAULT false,
	`defaultWrapperId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `wrapper_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`wrapperId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wrapper_favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wrapper_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`wrapperId` int NOT NULL,
	`rating` int NOT NULL,
	`review` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wrapper_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wrapper_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wrapperId` int NOT NULL,
	`tag` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wrapper_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_settings` ADD CONSTRAINT `user_settings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wrapper_favorites` ADD CONSTRAINT `wrapper_favorites_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wrapper_favorites` ADD CONSTRAINT `wrapper_favorites_wrapperId_wrappers_id_fk` FOREIGN KEY (`wrapperId`) REFERENCES `wrappers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wrapper_ratings` ADD CONSTRAINT `wrapper_ratings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wrapper_ratings` ADD CONSTRAINT `wrapper_ratings_wrapperId_wrappers_id_fk` FOREIGN KEY (`wrapperId`) REFERENCES `wrappers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wrapper_tags` ADD CONSTRAINT `wrapper_tags_wrapperId_wrappers_id_fk` FOREIGN KEY (`wrapperId`) REFERENCES `wrappers`(`id`) ON DELETE no action ON UPDATE no action;