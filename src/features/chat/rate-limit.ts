import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const chatRequestLimitPerMinute = 10;

export function hashClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
  const salt = getServerEnv().RATE_LIMIT_SALT ?? "friday-local-rate-limit-salt";

  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function consumeChatRateLimit(userId: string, ipHash: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("consume_chat_rate_limit", {
    p_user_id: userId,
    p_ip_hash: ipHash,
    p_limit: chatRequestLimitPerMinute,
  });

  if (error) {
    return false;
  }

  return data;
}
