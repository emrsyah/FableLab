import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { postsTable, usersTable } from "./schema/users";
import { lessons } from "./schema/lessons";
import { scenes, quizzes } from "./schema/scenes";

config({ path: ".env.local" }); // or .env.local

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(databaseUrl);
export const db = drizzle({
  client: sql,
  schema: {
    users: usersTable,
    posts: postsTable,
    lessons,
    scenes,
    quizzes,
  },
});
