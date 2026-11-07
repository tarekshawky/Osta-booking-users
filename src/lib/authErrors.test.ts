import { describe, it, expect } from "vitest";
import { ApiError } from "./api";
import { authErrorKey } from "./authErrors";

describe("auth error messages", () => {
  it("maps server answers to the page's own translated messages", () => {
    expect(authErrorKey(new ApiError("x", 401, "invalid_credentials"))).toBe("auth.errCredentials");
    expect(authErrorKey(new ApiError("x", 429, "rate_limited"))).toBe("auth.errRateLimited");
    expect(authErrorKey(new ApiError("x", 409, "conflict"))).toBe("auth.errExists");
    expect(authErrorKey(new ApiError("x", 500))).toBe("auth.errGeneric");
  });
  it("treats a failed fetch as a network problem", () => {
    expect(authErrorKey(new TypeError("Failed to fetch"))).toBe("auth.errNetwork");
  });
});
