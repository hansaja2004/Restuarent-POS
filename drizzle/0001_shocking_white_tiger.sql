CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"phone" text NOT NULL,
	"email" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "customers_phone_unique" UNIQUE("phone"),
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_number" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "subtotal" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tax_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "service_charge" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_type" text DEFAULT 'Takeaway';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refund_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refund_method" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_id" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_available" boolean DEFAULT true NOT NULL;