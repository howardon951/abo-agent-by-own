import { createClient } from "@supabase/supabase-js";
import { supabaseSecretKey, supabaseUrl } from "@/lib/env";

export function createAdminSupabaseClient() {
  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function requireAdminClient() {
  const client = createAdminSupabaseClient();
  if (!client) {
    throw new Error("Supabase secret key is not configured");
  }
  return client;
}
