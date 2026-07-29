type RuntimeBindings = { DB?: D1Database };
declare global { var __SITE_RUNTIME_BINDINGS__: RuntimeBindings | undefined }
export function database() {
  const db = globalThis.__SITE_RUNTIME_BINDINGS__?.DB;
  if (!db) throw new Error("Database binding is unavailable.");
  return db;
}
