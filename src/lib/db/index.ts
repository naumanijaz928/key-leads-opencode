import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

let cached: Database | null = null;

export function db(): Database {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (Supabase connection string).",
    );
  }
  const client = postgres(url, { max: 5, prepare: false, idle_timeout: 20 });
  cached = drizzle(client, { schema });
  return cached;
}

export { schema };
export type { schema as Schema };
