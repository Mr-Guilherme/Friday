import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { getOwnedConversation } from "@/features/chat/data";
import {
  buildConversationTitle,
  englishCoachSystemPrompt,
  toModelMessages,
} from "@/features/chat/prompt";
import { consumeChatRateLimit, hashClientIp } from "@/features/chat/rate-limit";
import { chatRequestSchema } from "@/features/chat/schemas";
import { getServerEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const maxDuration = 30;

async function createConversation(userId: string, title: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId, title })
    .select("id, user_id, title, created_at, updated_at")
    .single();

  if (error) {
    return null;
  }

  return data;
}

async function resolveConversation(
  userId: string,
  conversationId: string | undefined,
  message: string,
) {
  if (!conversationId) {
    return createConversation(userId, buildConversationTitle(message));
  }

  return getOwnedConversation(conversationId, userId);
}

function createTextResponse(text: string, conversationId: string) {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-conversation-id": conversationId,
    },
  });
}

export async function POST(request: NextRequest) {
  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid chat request." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const allowed = await consumeChatRateLimit(user.id, hashClientIp(request));

  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const conversation = await resolveConversation(
    user.id,
    parsed.data.conversationId,
    parsed.data.message,
  );

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    user_id: user.id,
    role: "user",
    content: parsed.data.message,
  });

  const { data: history } = await supabase
    .from("messages")
    .select("id, conversation_id, user_id, role, content, created_at")
    .eq("conversation_id", conversation.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(24);

  const env = getServerEnv();

  if (env.FRIDAY_MOCK_AI) {
    const text = "Let's practice that. Say it again as if you were updating your engineering team.";
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      user_id: user.id,
      role: "assistant",
      content: text,
    });
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversation.id);
    return createTextResponse(text, conversation.id);
  }

  if (!env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key is not configured." }, { status: 503 });
  }

  const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
  const result = streamText({
    model: openai("gpt-4.1-mini"),
    system: englishCoachSystemPrompt,
    messages: toModelMessages(history ?? []),
    maxOutputTokens: 700,
    temperature: 0.7,
    onFinish: async ({ text }) => {
      if (!text.trim()) {
        return;
      }

      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        user_id: user.id,
        role: "assistant",
        content: text,
      });
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversation.id);
    },
  });

  return result.toTextStreamResponse({
    headers: {
      "x-conversation-id": conversation.id,
    },
  });
}
