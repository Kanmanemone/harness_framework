import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeComments } from "./analyzeService";
import type { Comment, AnalysisReport } from "@/types";

const mockComments: Comment[] = [
  {
    id: "c1",
    text: "좋은 영상입니다",
    author: "홍길동",
    likeCount: 10,
    publishedAt: "2024-01-01T00:00:00Z",
  },
];

const mockReport: AnalysisReport = {
  summary: "전반적으로 긍정적",
  sentiment: { positive: 80, neutral: 15, negative: 5 },
  strengths: ["설명이 명확하다"],
  improvements: ["음질 개선 필요"],
  representativeComments: {
    positive: [{ text: "좋은 영상입니다", author: "홍길동" }],
    neutral: [],
    negative: [],
  },
};

describe("analyzeComments", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("정상 응답 시 AnalysisReport를 반환한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockReport),
      })
    );

    const result = await analyzeComments(mockComments, "sk-ant-test");

    expect(result).toEqual(mockReport);
    expect(fetch).toHaveBeenCalledWith("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comments: mockComments, apiKey: "sk-ant-test" }),
    });
  });

  it("에러 응답 시 error 필드 값으로 Error를 throw한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({ error: "Invalid Anthropic API key" }),
      })
    );

    await expect(analyzeComments(mockComments, "bad-key")).rejects.toThrow(
      "Invalid Anthropic API key"
    );
  });

  it("fetch 자체 실패 시 Error를 throw한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    );

    await expect(analyzeComments(mockComments, "key")).rejects.toThrow(
      "Failed to fetch"
    );
  });
});
