import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

function createRequest(path: string) {
  return new NextRequest(`http://localhost:3000${path}`);
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to login when the code is missing", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(createRequest("/auth/callback"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=missing_code");
  });

  it("redirects to login when Supabase rejects the code", async () => {
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: new Error("expired") }),
      },
    });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(createRequest("/auth/callback?code=bad"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=auth_callback",
    );
  });

  it("redirects to the requested next path after a valid code", async () => {
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      },
    });
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(createRequest("/auth/callback?code=ok&next=/"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });
});
