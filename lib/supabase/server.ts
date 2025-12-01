import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import type { Database } from "@/database.types"

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set(name: string, value: string, options?: CookieOptions) {
          try {
            cookieStore.set(name, value, options)
          } catch {
          }
        },
        remove(name: string, options?: CookieOptions) {
          try {
            cookieStore.delete({ name, ...options })
          } catch {
          }
        },
      },
    }
  )
}
