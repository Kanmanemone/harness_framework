import { describe, it, expect, afterEach } from "vitest";
import { GET } from "./route";

function makeRequest(): Request {
  return new Request("http://localhost:3000/api/env-keys");
}

describe("GET /api/env-keys", () => {
  afterEach(() => {
    delete process.env.YOUTUBE_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  it("env 키가 모두 없으면 { youtube: false, gemini: false }", async () => {
    delete process.env.YOUTUBE_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ youtube: false, gemini: false });
  });

  it("YOUTUBE_API_KEY만 있으면 { youtube: true, gemini: false }", async () => {
    process.env.YOUTUBE_API_KEY = "some-key";
    delete process.env.GEMINI_API_KEY;

    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body).toEqual({ youtube: true, gemini: false });
  });

  it("GEMINI_API_KEY만 있으면 { youtube: false, gemini: true }", async () => {
    delete process.env.YOUTUBE_API_KEY;
    process.env.GEMINI_API_KEY = "some-key";

    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body).toEqual({ youtube: false, gemini: true });
  });

  it("모두 있으면 { youtube: true, gemini: true }", async () => {
    process.env.YOUTUBE_API_KEY = "yt-key";
    process.env.GEMINI_API_KEY = "gem-key";

    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body).toEqual({ youtube: true, gemini: true });
  });

  it("빈 문자열은 false로 처리", async () => {
    process.env.YOUTUBE_API_KEY = "";
    process.env.GEMINI_API_KEY = "";

    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body).toEqual({ youtube: false, gemini: false });
  });
});
