import { describe, expect, it } from "vitest";
import { groupMessagesByConversation, sortConversations } from "@/features/chat/data";
import type { ChatMessage, Conversation } from "@/features/chat/types";

function createMessage(conversationId: string, content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    conversation_id: conversationId,
    user_id: crypto.randomUUID(),
    role: "user",
    content,
    created_at: new Date().toISOString(),
  };
}

function createConversation(id: string, updatedAt: string): Conversation {
  return {
    id,
    user_id: crypto.randomUUID(),
    title: id,
    created_at: updatedAt,
    updated_at: updatedAt,
  };
}

describe("groupMessagesByConversation", () => {
  it("groups messages by conversation id", () => {
    const firstId = crypto.randomUUID();
    const secondId = crypto.randomUUID();
    const grouped = groupMessagesByConversation([
      createMessage(firstId, "A"),
      createMessage(secondId, "B"),
      createMessage(firstId, "C"),
    ]);

    expect(grouped[firstId]).toHaveLength(2);
    expect(grouped[secondId]).toHaveLength(1);
  });
});

describe("sortConversations", () => {
  it("sorts newest conversations first", () => {
    const conversations = [
      createConversation("old", "2026-01-01T00:00:00.000Z"),
      createConversation("new", "2026-02-01T00:00:00.000Z"),
    ];

    expect(sortConversations(conversations).map((conversation) => conversation.id)).toEqual([
      "new",
      "old",
    ]);
  });
});
