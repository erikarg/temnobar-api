import { execSync } from "node:child_process";
import pg from "pg";

const DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/temnobar_test?schema=public";

export async function setup() {
  const client = new pg.Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/postgres",
  });
  await client.connect();

  const result = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = 'temnobar_test'",
  );
  if (result.rowCount === 0) {
    await client.query("CREATE DATABASE temnobar_test");
  }
  await client.end();

  execSync("npx prisma db push", {
    env: { ...process.env, DATABASE_URL },
    stdio: "pipe",
  });
}
