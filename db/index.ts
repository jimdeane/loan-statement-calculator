import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { database } from "../app/lib/db";

export function getDb() {
  return drizzle(database(), { schema });
}
