import type { ChatMessage } from "@/features/chat/types";

export type OptimisticMessage = Pick<
  ChatMessage,
  "id" | "conversation_id" | "role" | "content" | "created_at"
>;

export type OptimisticMessageGroup = Record<string, OptimisticMessage[]>;

export function appendOptimisticMessages(input: {
  groups: OptimisticMessageGroup;
  conversationId: string;
  userMessage: OptimisticMessage;
  assistantMessage: OptimisticMessage;
}) {
  const { groups, conversationId, userMessage, assistantMessage } = input;

  return {
    ...groups,
    [conversationId]: [...(groups[conversationId] ?? []), userMessage, assistantMessage],
  };
}

export function reconcileConversationMessages(input: {
  groups: OptimisticMessageGroup;
  fromConversationId: string;
  toConversationId: string;
}) {
  const { groups, fromConversationId, toConversationId } = input;

  if (fromConversationId === toConversationId) {
    return groups;
  }

  const draftMessages = groups[fromConversationId] ?? [];
  const reconciledMessages = draftMessages.map((message) => ({
    ...message,
    conversation_id: toConversationId,
  }));
  const { [fromConversationId]: _removed, ...remainingGroups } = groups;

  return {
    ...remainingGroups,
    [toConversationId]: [...(remainingGroups[toConversationId] ?? []), ...reconciledMessages],
  };
}

export function appendAssistantContent(input: {
  groups: OptimisticMessageGroup;
  conversationId: string;
  assistantId: string;
  chunk: string;
}) {
  const { groups, conversationId, assistantId, chunk } = input;

  return {
    ...groups,
    [conversationId]: (groups[conversationId] ?? []).map((message) =>
      message.id === assistantId ? { ...message, content: `${message.content}${chunk}` } : message,
    ),
  };
}

export function removeOptimisticMessage(input: {
  groups: OptimisticMessageGroup;
  conversationId: string;
  messageId: string;
}) {
  const { groups, conversationId, messageId } = input;

  return {
    ...groups,
    [conversationId]: (groups[conversationId] ?? []).filter((message) => message.id !== messageId),
  };
}
