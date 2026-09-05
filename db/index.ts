import * as schema from "./schema";

/**
 * Database adapter placeholder for Vercel.
 *
 * The original ChatGPT Sites runtime injected Cloudflare D1 as `env.DB`.
 * Vercel has no equivalent implicit binding, so callers must use the
 * application-level persistence adapter once one is configured.
 */
export function getDb(): any {
  void schema;
  throw new Error(
    "Quranexa persistent database is not configured on this Vercel deployment."
  );
}
