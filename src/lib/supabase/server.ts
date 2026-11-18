import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";
import type { Database } from "./database.types";
import { SESSION_COOKIE_FLAGS } from "./session-cookie";

/**
 * Session-bound client for the admin area (RLS evaluates as the signed-in user).
 * Reads cookies → never call inside 'use cache'; render consumers behind <Suspense>.
 */
export async function createSessionClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, { ...options, ...SESSION_COOKIE_FLAGS });
            }
          } catch {
            // Called from a Server Component: cookies are refreshed by proxy.ts instead.
          }
        },
      },
    },
  );
}
