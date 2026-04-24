import { createOpenAI } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { getOwnedConversation } from "@/features/chat/data";
import {
  buildConversationTitle,
  conversationTitleSystemPrompt,
  englishCoachSystemPrompt,
  sanitizeConversationTitle,
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

async function generateConversationTitle(
  message: string,
  apiKey: string | undefined,
  mock: string | undefined,
) {
  if (mock || !apiKey) {
    return buildConversationTitle(message);
  }

  const openai = createOpenAI({ apiKey });
  const { text } = await generateText({
    model: openai("gpt-4.1-mini"),
    system: conversationTitleSystemPrompt,
    prompt: message,
    maxOutputTokens: 24,
    temperature: 0.2,
  });

  return sanitizeConversationTitle(text, message);
}

async function resolveConversation(input: {
  userId: string;
  conversationId: string | undefined;
  message: string;
  apiKey: string | undefined;
  mock: string | undefined;
}) {
  const { userId, conversationId, message, apiKey, mock } = input;

  if (!conversationId) {
    const title = await generateConversationTitle(message, apiKey, mock);
    return createConversation(userId, title);
  }

  return getOwnedConversation(conversationId, userId);
}

function createTextResponse(text: string, conversationId: string, title: string) {
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
      "x-conversation-title": title,
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

  const env = getServerEnv();
  const conversation = await resolveConversation({
    userId: user.id,
    conversationId: parsed.data.conversationId,
    message: parsed.data.message,
    apiKey: env.OPENAI_API_KEY,
    mock: env.FRIDAY_MOCK_AI,
  });

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
    return createTextResponse(text, conversation.id, conversation.title);
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
      "x-conversation-title": conversation.title,
    },
  });
}
