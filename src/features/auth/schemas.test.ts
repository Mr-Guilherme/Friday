import { describe, expect, it } from "vitest";
import { magicLinkSchema } from "@/features/auth/schemas";

describe("magicLinkSchema", () => {
  it("accepts valid email addresses", () => {
    const parsed = magicLinkSchema.parse({ email: "engineer@example.com" });

    expect(parsed.email).toBe("engineer@example.com");
  });

  it("rejects invalid email addresses", () => {
    const parsed = magicLinkSchema.safeParse({ email: "engineer" });

    expect(parsed.success).toBe(false);
  });
});
