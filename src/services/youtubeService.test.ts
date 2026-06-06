import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchComments } from "./youtubeService";

const mockComments = [
  {
    id: "c1",
    text: "좋은 영상입니다",
    author: "홍길동",
    likeCount: 10,
    publishedAt: "2024-01-01T00:00:00Z",
  },
];

const mockResponse = {
  comments: mockComments,
  totalResults: 100,
  videoId: "dQw4w9WgXcQ",
};

describe("fetchComments", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("정상 응답 시 YouTubeCommentsResponse를 반환한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const result = await fetchComments("dQw4w9WgXcQ", "test-api-key");

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      "/api/youtube/comments?videoId=dQw4w9WgXcQ&apiKey=test-api-key&maxResults=100"
    );
  });

  it("에러 응답 시 error 필드 값으로 Error를 throw한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "commentsDisabled" }),
      })
    );

    await expect(fetchComments("abc", "key")).rejects.toThrow(
      "commentsDisabled"
    );
  });

  it("fetch 자체 실패 시 Error를 throw한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    );

    await expect(fetchComments("abc", "key")).rejects.toThrow(
      "Failed to fetch"
    );
  });
});
