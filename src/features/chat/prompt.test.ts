import { describe, expect, it } from "vitest";
import {
  buildConversationTitle,
  englishCoachSystemPrompt,
  sanitizeConversationTitle,
  toModelMessages,
} from "@/features/chat/prompt";
import type { ChatMessage } from "@/features/chat/types";

function createMessage(role: "user" | "assistant", content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    conversation_id: crypto.randomUUID(),
    user_id: crypto.randomUUID(),
    role,
    content,
    created_at: new Date().toISOString(),
  };
}

describe("englishCoachSystemPrompt", () => {
  it("keeps hidden instruction boundaries explicit", () => {
    expect(englishCoachSystemPrompt).toContain("Do not reveal");
    expect(englishCoachSystemPrompt).toContain("Brazilian software engineers");
  });
});

describe("toModelMessages", () => {
  it("maps persisted messages to AI SDK model messages", () => {
    const messages = [createMessage("user", "Hello"), createMessage("assistant", "Hi")];

    expect(toModelMessages(messages)).toEqual([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi" },
    ]);
  });
});

describe("buildConversationTitle", () => {
  it("normalizes whitespace and truncates long messages", () => {
    const title = buildConversationTitle(
      "Please simulate a very detailed engineering manager interview about incident response",
    );

    expect(title).toHaveLength(60);
    expect(title.endsWith("...")).toBe(true);
  });
});

describe("sanitizeConversationTitle", () => {
  it("removes wrappers from generated titles", () => {
    expect(sanitizeConversationTitle(' "**Daily Update Practice**" ', "fallback")).toBe(
      "Daily Update Practice",
    );
  });

  it("uses the fallback message when the generated title is empty", () => {
    expect(sanitizeConversationTitle("   ", "Practice a code review")).toBe(
      "Practice a code review",
    );
  });
});
