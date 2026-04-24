import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const confirmSearchSchema = z.object({
  token_hash: z.string().min(16),
  type: z.enum(["signup", "invite", "magiclink", "recovery", "email", "email_change"]),
  next: z.string().startsWith("/").default("/"),
});

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const parsed = confirmSearchSchema.safeParse({
    token_hash: requestUrl.searchParams.get("token_hash"),
    type: requestUrl.searchParams.get("type"),
    next: requestUrl.searchParams.get("next") ?? "/",
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/login?error=invalid_link", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: parsed.data.token_hash,
    type: parsed.data.type as EmailOtpType,
  });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=expired_link", request.url));
  }

  return NextResponse.redirect(new URL(parsed.data.next, request.url));
}
