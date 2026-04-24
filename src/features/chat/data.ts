import { unstable_noStore as noStore } from "next/cache";
import type { ChatMessage, Conversation, MessageGroup } from "@/features/chat/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getConversationState(userId: string) {
  noStore();

  const supabase = await createSupabaseServerClient();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, user_id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(30);

  const { data: messages } = await supabase
    .from("messages")
    .select("id, conversation_id, user_id, role, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(300);

  return {
    conversations: conversations ?? [],
    messagesByConversation: groupMessagesByConversation(messages ?? []),
  };
}

export function groupMessagesByConversation(messages: ChatMessage[]): MessageGroup {
  return messages.reduce<MessageGroup>((groups, message) => {
    const group = groups[message.conversation_id] ?? [];
    groups[message.conversation_id] = [...group, message];
    return groups;
  }, {});
}

export async function getOwnedConversation(conversationId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("conversations")
    .select("id, user_id, title, created_at, updated_at")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  return data;
}

export function sortConversations(conversations: Conversation[]) {
  return [...conversations].sort((first, second) =>
    second.updated_at.localeCompare(first.updated_at),
  );
}
