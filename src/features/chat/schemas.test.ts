import { describe, expect, it } from "vitest";
import { chatRequestSchema } from "@/features/chat/schemas";

describe("chatRequestSchema", () => {
  it("accepts a trimmed chat message", () => {
    const parsed = chatRequestSchema.parse({ message: "  Practice a code review  " });

    expect(parsed.message).toBe("Practice a code review");
  });

  it("rejects empty messages", () => {
    const parsed = chatRequestSchema.safeParse({ message: "   " });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid conversation ids", () => {
    const parsed = chatRequestSchema.safeParse({
      conversationId: "not-a-uuid",
      message: "Hello",
    });

    expect(parsed.success).toBe(false);
  });
});
