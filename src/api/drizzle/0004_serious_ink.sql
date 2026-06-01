CREATE UNLOGGED TABLE "scraper_cache" (
	"url_hash" varchar(64) PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"content" text NOT NULL,
	"scraped_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
