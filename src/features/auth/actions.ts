"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { magicLinkSchema } from "@/features/auth/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getAuthOrigin(headersList: Headers) {
  return headersList.get("origin") ?? "http://localhost:3000";
}

type AuthActionState = {
  ok: boolean;
  message: string;
};

export async function signInWithMagicLink(_state: AuthActionState, formData: FormData) {
  const parsed = magicLinkSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const headersList = await headers();
  const origin = getAuthOrigin(headersList);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { ok: false, message: "Could not send the magic link. Try again soon." };
  }

  return { ok: true, message: "Check your email to continue." };
}

export async function signInWithGoogle() {
  const headersList = await headers();
  const origin = getAuthOrigin(headersList);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    redirect("/login?error=google_oauth");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
