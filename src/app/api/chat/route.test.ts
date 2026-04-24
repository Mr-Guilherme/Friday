import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  consumeChatRateLimit: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  getServerEnv: vi.fn(),
}));

vi.mock("@/features/chat/rate-limit", async () => {
  const actual = await vi.importActual<typeof import("@/features/chat/rate-limit")>(
    "@/features/chat/rate-limit",
  );

  return {
    ...actual,
    consumeChatRateLimit: mocks.consumeChatRateLimit,
  };
});

vi.mock("@/lib/env", () => ({
  getServerEnv: mocks.getServerEnv,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

const user = { id: "3fbc61f1-ff6f-4f47-92c0-fb1bc65a60f4" };
const conversation = {
  id: "21ba7cb1-e26b-48ec-b683-85bf1b1e935a",
  user_id: user.id,
  title: "Practice a daily update",
  created_at: "2026-04-24T00:00:00.000Z",
  updated_at: "2026-04-24T00:00:00.000Z",
};

function createRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.10",
    },
  });
}

function createSupabaseMock(currentUser: typeof user | null) {
  const messageInsert = vi.fn().mockResolvedValue({ error: null });
  const conversationInsert = vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn().mockResolvedValue({ data: conversation, error: null }),
    })),
  }));
  const conversationUpdate = vi.fn(() => ({
    eq: vi.fn().mockResolvedValue({ error: null }),
  }));
  const messageSelect = vi.fn(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue({ data: [] }),
        })),
      })),
    })),
  }));

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: currentUser } }),
    },
    from: vi.fn((table: string) => {
      if (table === "conversations") {
        return { insert: conversationInsert, update: conversationUpdate };
      }

      return { insert: messageInsert, select: messageSelect };
    }),
    spies: {
      conversationInsert,
      conversationUpdate,
      messageInsert,
    },
  };
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerEnv.mockReturnValue({
      FRIDAY_MOCK_AI: "1",
      OPENAI_API_KEY: undefined,
      RATE_LIMIT_SALT: "test-salt",
    });
    mocks.consumeChatRateLimit.mockResolvedValue(true);
  });

  it("rejects invalid payloads before touching auth", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(createRequest({ message: "" }));

    expect(response.status).toBe(400);
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("requires an authenticated user", async () => {
    const supabase = createSupabaseMock(null);
    mocks.createSupabaseServerClient.mockResolvedValue(supabase);
    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(createRequest({ message: "Practice a daily update" }));

    expect(response.status).toBe(401);
  });

  it("returns a rate limit response before persisting messages", async () => {
    const supabase = createSupabaseMock(user);
    mocks.createSupabaseServerClient.mockResolvedValue(supabase);
    mocks.consumeChatRateLimit.mockResolvedValue(false);
    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(createRequest({ message: "Practice a daily update" }));

    expect(response.status).toBe(429);
    expect(supabase.spies.messageInsert).not.toHaveBeenCalled();
  });

  it("streams a mocked assistant response with conversation headers", async () => {
    const supabase = createSupabaseMock(user);
    mocks.createSupabaseServerClient.mockResolvedValue(supabase);
    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(createRequest({ message: "Practice a daily update" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-conversation-id")).toBe(conversation.id);
    expect(response.headers.get("x-conversation-title")).toBe(conversation.title);
    expect(await response.text()).toContain("Let's practice that");
    expect(supabase.spies.messageInsert).toHaveBeenCalledTimes(2);
  });
});
