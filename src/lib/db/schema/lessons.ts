import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const lessons = pgTable("lessons", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  topic: text("topic").notNull(),
  complexity: text("complexity").notNull(), // Elementary, Middle, High
  title: text("title").notNull(),
  slug: text("slug").unique(),
  
  // Metadata
  views: integer("views").default(0),
  completions: integer("completions").default(0),
  
  // Author
  userId: text("user_id"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});
