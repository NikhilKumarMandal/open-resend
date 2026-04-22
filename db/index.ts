import { drizzle } from "drizzle-orm/neon-http";
import { schema } from "@/db/schema";

export const db = drizzle(process.env.DATABASE_URL!, {
    schema,
});