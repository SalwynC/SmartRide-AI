import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error(
    "❌ DATABASE_URL is not set. Please configure it in your .env file.",
  );
  process.exit(1);
}

let pool: pg.Pool;
let db: NodePgDatabase<typeof schema>;

try {
  pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000, // Increased from 10s to 20s for remote Neon DB
  });

  pool.on("error", (err: Error) => {
    console.error("❌ Unexpected error on idle client", err);
    process.exit(-1);
  });

  db = drizzle(pool, { schema });
  console.log("✅ Database connection pool initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize database connection:", error);
  process.exit(1);
}

export { pool, db };
