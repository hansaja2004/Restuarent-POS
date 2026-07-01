import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    await sql`CREATE TABLE IF NOT EXISTS "customers" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" text,
      "phone" text NOT NULL,
      "email" text,
      "created_at" timestamp DEFAULT now(),
      CONSTRAINT "customers_phone_unique" UNIQUE("phone"),
      CONSTRAINT "customers_email_unique" UNIQUE("email")
    );`;
    console.log('Created customers table');
  } catch(e) { console.error(e) }
  
  try {
    await sql`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_id" integer;`;
    console.log('Added customer_id to orders');
  } catch(e) { console.error(e) }
}
run();
