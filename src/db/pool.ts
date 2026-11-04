import { Pool } from "pg";
import { env } from "../env.js";

const isRemote =
  env.DATABASE_URL.includes("@") &&
  !env.DATABASE_URL.includes("localhost") &&
  !env.DATABASE_URL.includes("127.0.0.1");

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
});
