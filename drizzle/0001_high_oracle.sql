CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(64) NOT NULL,
	`label` varchar(128),
	`keyHash` varchar(256) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`wrapperId` int NOT NULL,
	`title` varchar(256) NOT NULL DEFAULT 'New conversation',
	`messages` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`slug` varchar(32) NOT NULL,
	`description` text,
	`priceMonthly` decimal(10,2) NOT NULL DEFAULT '0',
	`priceYearly` decimal(10,2) NOT NULL DEFAULT '0',
	`stripePriceIdMonthly` varchar(128),
	`stripePriceIdYearly` varchar(128),
	`monthlyRequestLimit` int,
	`monthlyTokenLimit` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `plans_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `usage_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`wrapperId` int NOT NULL,
	`requestType` varchar(64) NOT NULL,
	`inputTokens` int NOT NULL DEFAULT 0,
	`outputTokens` int NOT NULL DEFAULT 0,
	`baseCostUsd` decimal(12,6) NOT NULL DEFAULT '0',
	`marginUsd` decimal(12,6) NOT NULL DEFAULT '0',
	`totalChargedUsd` decimal(12,6) NOT NULL DEFAULT '0',
	`status` enum('success','error','rate_limited') NOT NULL DEFAULT 'success',
	`errorMessage` text,
	`durationMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usage_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`status` enum('active','cancelled','expired','trialing') NOT NULL DEFAULT 'active',
	`stripeSubscriptionId` varchar(128),
	`stripeCustomerId` varchar(128),
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wrapper_plan_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wrapperId` int NOT NULL,
	`planId` int NOT NULL,
	`requestLimitOverride` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wrapper_plan_access_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wrappers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`description` text,
	`category` enum('chat','image','document','code','audio','video','search','custom') NOT NULL DEFAULT 'chat',
	`provider` varchar(64) NOT NULL,
	`modelId` varchar(128),
	`icon` varchar(64) DEFAULT 'bot',
	`color` varchar(32) DEFAULT '#6366f1',
	`config` json,
	`costPerRequest` decimal(12,6) NOT NULL DEFAULT '0',
	`costPer1kTokens` decimal(12,6) NOT NULL DEFAULT '0',
	`marginMultiplier` decimal(6,3) NOT NULL DEFAULT '1.500',
	`isActive` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wrappers_id` PRIMARY KEY(`id`),
	CONSTRAINT `wrappers_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_wrapperId_wrappers_id_fk` FOREIGN KEY (`wrapperId`) REFERENCES `wrappers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usage_logs` ADD CONSTRAINT `usage_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usage_logs` ADD CONSTRAINT `usage_logs_wrapperId_wrappers_id_fk` FOREIGN KEY (`wrapperId`) REFERENCES `wrappers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_plans` ADD CONSTRAINT `user_plans_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_plans` ADD CONSTRAINT `user_plans_planId_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wrapper_plan_access` ADD CONSTRAINT `wrapper_plan_access_wrapperId_wrappers_id_fk` FOREIGN KEY (`wrapperId`) REFERENCES `wrappers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wrapper_plan_access` ADD CONSTRAINT `wrapper_plan_access_planId_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE no action ON UPDATE no action;