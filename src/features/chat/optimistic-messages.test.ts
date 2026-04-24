import { describe, expect, it } from "vitest";
import {
  appendAssistantContent,
  appendOptimisticMessages,
  type OptimisticMessage,
  reconcileConversationMessages,
  removeOptimisticMessage,
} from "@/features/chat/optimistic-messages";

function createMessage(input: Partial<OptimisticMessage> = {}): OptimisticMessage {
  return {
    id: input.id ?? crypto.randomUUID(),
    conversation_id: input.conversation_id ?? "draft",
    role: input.role ?? "user",
    content: input.content ?? "Hello",
    created_at: input.created_at ?? new Date().toISOString(),
  };
}

describe("appendOptimisticMessages", () => {
  it("adds user and assistant draft messages immediately", () => {
    const userMessage = createMessage({ id: "user", role: "user" });
    const assistantMessage = createMessage({ id: "assistant", role: "assistant", content: "" });
    const groups = appendOptimisticMessages({
      groups: {},
      conversationId: "draft",
      userMessage,
      assistantMessage,
    });

    expect(groups.draft).toEqual([userMessage, assistantMessage]);
  });
});

describe("reconcileConversationMessages", () => {
  it("moves draft messages to the server conversation id", () => {
    const groups = reconcileConversationMessages({
      groups: {
        draft: [createMessage({ conversation_id: "draft" })],
      },
      fromConversationId: "draft",
      toConversationId: "server",
    });

    expect(groups.draft).toBeUndefined();
    expect(groups.server?.[0]?.conversation_id).toBe("server");
  });
});

describe("appendAssistantContent", () => {
  it("appends streamed chunks to the assistant message", () => {
    const groups = appendAssistantContent({
      groups: {
        server: [createMessage({ id: "assistant", role: "assistant", content: "Hi" })],
      },
      conversationId: "server",
      assistantId: "assistant",
      chunk: " there",
    });

    expect(groups.server?.[0]?.content).toBe("Hi there");
  });
});

describe("removeOptimisticMessage", () => {
  it("removes the assistant draft while keeping the user message", () => {
    const groups = removeOptimisticMessage({
      groups: {
        draft: [
          createMessage({ id: "user", role: "user" }),
          createMessage({ id: "assistant", role: "assistant" }),
        ],
      },
      conversationId: "draft",
      messageId: "assistant",
    });

    expect(groups.draft?.map((message) => message.id)).toEqual(["user"]);
  });
});
