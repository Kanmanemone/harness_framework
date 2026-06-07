import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";

const VALID_VIDEO_ID = "dQw4w9WgXcQ";
const VALID_API_KEY = "AIzaSyTestKey123";

function makeRequest(params: Record<string, string>): Request {
  const url = new URL("http://localhost:3000/api/youtube/comments");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

function makeYouTubeResponse(items: unknown[], totalResults = 100) {
  return {
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        pageInfo: { totalResults },
        items,
      }),
  };
}

function makeYouTubeItem(overrides: Partial<{
  id: string;
  textDisplay: string;
  authorDisplayName: string;
  likeCount: number;
  publishedAt: string;
}> = {}) {
  return {
    id: overrides.id ?? "comment-1",
    snippet: {
      topLevelComment: {
        snippet: {
          textDisplay: overrides.textDisplay ?? "좋은 영상 감사합니다",
          authorDisplayName: overrides.authorDisplayName ?? "홍길동",
          likeCount: overrides.likeCount ?? 42,
          publishedAt: overrides.publishedAt ?? "2024-01-15T09:30:00Z",
        },
      },
    },
  };
}

function makeYouTubeErrorResponse(
  status: number,
  reason: string,
  message = "Error"
) {
  return {
    ok: false,
    status,
    json: () =>
      Promise.resolve({
        error: {
          code: status,
          message,
          errors: [{ reason }],
        },
      }),
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/youtube/comments", () => {
  describe("정상 응답", () => {
    it("items가 있으면 200 + Comment[] 반환", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeYouTubeResponse(
            [
              makeYouTubeItem({ id: "c1", textDisplay: "좋아요", authorDisplayName: "유저A", likeCount: 10, publishedAt: "2024-01-01T00:00:00Z" }),
              makeYouTubeItem({ id: "c2", textDisplay: "별로예요", authorDisplayName: "유저B", likeCount: 5, publishedAt: "2024-01-02T00:00:00Z" }),
            ],
            500
          )
        )
      );

      const res = await GET(makeRequest({ videoId: VALID_VIDEO_ID, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.videoId).toBe(VALID_VIDEO_ID);
      expect(body.totalResults).toBe(500);
      expect(body.comments).toHaveLength(2);
      expect(body.comments[0]).toEqual({
        id: "c1",
        text: "좋아요",
        author: "유저A",
        likeCount: 10,
        publishedAt: "2024-01-01T00:00:00Z",
      });
    });

    it("items가 비어 있으면 200 + 빈 배열", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(makeYouTubeResponse([], 0))
      );

      const res = await GET(makeRequest({ videoId: VALID_VIDEO_ID, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.comments).toEqual([]);
      expect(body.totalResults).toBe(0);
      expect(body.videoId).toBe(VALID_VIDEO_ID);
    });

    it("maxResults를 지정하면 YouTube API에 전달", async () => {
      const mockFetch = vi.fn().mockResolvedValue(makeYouTubeResponse([], 0));
      vi.stubGlobal("fetch", mockFetch);

      await GET(makeRequest({ videoId: VALID_VIDEO_ID, apiKey: VALID_API_KEY, maxResults: "50" }));

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("maxResults=50");
    });

    it("maxResults 미지정 시 기본값 100 사용", async () => {
      const mockFetch = vi.fn().mockResolvedValue(makeYouTubeResponse([], 0));
      vi.stubGlobal("fetch", mockFetch);

      await GET(makeRequest({ videoId: VALID_VIDEO_ID, apiKey: VALID_API_KEY }));

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("maxResults=100");
    });
  });

  describe("파라미터 누락", () => {
    it("videoId 없으면 400", async () => {
      const res = await GET(makeRequest({ apiKey: VALID_API_KEY }));
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe("Missing videoId or apiKey");
    });

    it("apiKey 없으면 + env 없으면 400", async () => {
      delete process.env.YOUTUBE_API_KEY;
      const res = await GET(makeRequest({ videoId: VALID_VIDEO_ID }));
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe("Missing videoId or apiKey");
    });
  });

  describe("env 폴백", () => {
    afterEach(() => {
      delete process.env.YOUTUBE_API_KEY;
    });

    it("apiKey 미전달 + YOUTUBE_API_KEY env 설정 → env 키로 요청", async () => {
      process.env.YOUTUBE_API_KEY = "env-yt-key";
      const mockFetch = vi.fn().mockResolvedValue(makeYouTubeResponse([], 0));
      vi.stubGlobal("fetch", mockFetch);

      const res = await GET(makeRequest({ videoId: VALID_VIDEO_ID }));
      expect(res.status).toBe(200);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("key=env-yt-key");
    });

    it("apiKey 빈 문자열 + YOUTUBE_API_KEY env 설정 → env 키로 요청", async () => {
      process.env.YOUTUBE_API_KEY = "env-yt-key";
      const mockFetch = vi.fn().mockResolvedValue(makeYouTubeResponse([], 0));
      vi.stubGlobal("fetch", mockFetch);

      const res = await GET(makeRequest({ videoId: VALID_VIDEO_ID, apiKey: "" }));
      expect(res.status).toBe(200);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("key=env-yt-key");
    });

    it("apiKey 전달 시 env보다 우선", async () => {
      process.env.YOUTUBE_API_KEY = "env-yt-key";
      const mockFetch = vi.fn().mockResolvedValue(makeYouTubeResponse([], 0));
      vi.stubGlobal("fetch", mockFetch);

      const res = await GET(makeRequest({ videoId: VALID_VIDEO_ID, apiKey: "user-key" }));
      expect(res.status).toBe(200);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("key=user-key");
      expect(calledUrl).not.toContain("key=env-yt-key");
    });
  });

  describe("YouTube API 에러", () => {
    it("commentsDisabled → 403", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(makeYouTubeErrorResponse(403, "commentsDisabled"))
      );

      const res = await GET(makeRequest({ videoId: VALID_VIDEO_ID, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(403);

      const body = await res.json();
      expect(body.error).toBe("commentsDisabled");
      expect(body.isApiKeyError).toBeUndefined();
    });

    it("quotaExceeded → 403", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(makeYouTubeErrorResponse(403, "quotaExceeded"))
      );

      const res = await GET(makeRequest({ videoId: VALID_VIDEO_ID, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(403);

      const body = await res.json();
      expect(body.error).toBe("quotaExceeded");
      expect(body.isApiKeyError).toBeUndefined();
    });

    it("videoNotFound → 404", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(makeYouTubeErrorResponse(404, "videoNotFound"))
      );

      const res = await GET(makeRequest({ videoId: VALID_VIDEO_ID, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.error).toBe("videoNotFound");
      expect(body.isApiKeyError).toBeUndefined();
    });

    it("badRequest → 400 + isApiKeyError: true", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeYouTubeErrorResponse(400, "badRequest", "API key not valid")
        )
      );

      const res = await GET(makeRequest({ videoId: VALID_VIDEO_ID, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toContain("YouTube API error");
      expect(body.isApiKeyError).toBe(true);
    });
  });

  describe("네트워크/타임아웃 에러", () => {
    it("타임아웃 → 504", async () => {
      const abortError = new DOMException("The operation was aborted", "AbortError");
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

      const res = await GET(makeRequest({ videoId: VALID_VIDEO_ID, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(504);

      const body = await res.json();
      expect(body.error).toBe("YouTube API timeout");
    });

    it("네트워크 실패 → 502", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

      const res = await GET(makeRequest({ videoId: VALID_VIDEO_ID, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(502);

      const body = await res.json();
      expect(body.error).toBe("Failed to reach YouTube API");
    });
  });
});
