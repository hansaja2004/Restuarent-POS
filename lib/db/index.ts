import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// We fall back to a dummy string to prevent runtime errors during build if env isn't set
const connectionString = process.env.DATABASE_URL || "postgres://user:pass@host/db";

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
