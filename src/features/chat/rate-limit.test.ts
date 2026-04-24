import { describe, expect, it } from "vitest";
import { getClientIp, hashIpAddress } from "@/features/chat/rate-limit";

describe("getClientIp", () => {
  it("uses the first forwarded ip", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 198.51.100.5",
      "x-real-ip": "198.51.100.7",
    });

    expect(getClientIp(headers)).toBe("203.0.113.10");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "198.51.100.7" });

    expect(getClientIp(headers)).toBe("198.51.100.7");
  });
});

describe("hashIpAddress", () => {
  it("hashes the ip with the configured salt", () => {
    expect(hashIpAddress("203.0.113.10", "salt-a")).toHaveLength(64);
    expect(hashIpAddress("203.0.113.10", "salt-a")).not.toBe(
      hashIpAddress("203.0.113.10", "salt-b"),
    );
  });
});
