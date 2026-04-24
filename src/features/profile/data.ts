import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getCurrentUserProfile() {
  noStore();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, preferred_locale, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    return { user, profile };
  }

  const { data: createdProfile, error } = await supabase
    .from("profiles")
    .insert({ id: user.id })
    .select("id, preferred_locale, created_at, updated_at")
    .single();

  if (error) {
    return null;
  }

  return { user, profile: createdProfile };
}
