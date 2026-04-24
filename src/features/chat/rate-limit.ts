import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const chatRequestLimitPerMinute = 10;
const fallbackRateLimitSalt = "friday-local-rate-limit-salt";

export function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return headers.get("x-real-ip") ?? "unknown";
}

export function hashIpAddress(ip: string, salt: string) {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function hashClientIp(request: NextRequest) {
  const salt = getServerEnv().RATE_LIMIT_SALT ?? fallbackRateLimitSalt;

  return hashIpAddress(getClientIp(request.headers), salt);
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
