import { describe, expect, it } from "vitest";
import { fixedBaseUrl } from "../src/lib/base-url";
describe("fixedBaseUrl", () => {
  it("Vercel production에서는 대표 도메인", () => {
    const env = process.env; process.env = { ...env, NEXT_PUBLIC_APP_URL: undefined, VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "saibyeol.vercel.app", AUTH_URL: undefined };
    expect(fixedBaseUrl()).toBe("https://saibyeol.vercel.app"); process.env = env;
  });
  it("NEXT_PUBLIC_APP_URL이 있으면 그것이 우선", () => {
    const env = process.env; process.env = { ...env, NEXT_PUBLIC_APP_URL: "https://saibyeol.app/", VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" };
    expect(fixedBaseUrl()).toBe("https://saibyeol.app"); process.env = env;
  });
});
