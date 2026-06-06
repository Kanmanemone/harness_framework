import { describe, it, expect } from "vitest";
import type {
  Comment,
  YouTubeCommentsResponse,
  SentimentRatio,
  RepresentativeComment,
  AnalysisReport,
  AppPhase,
  LoadingStep,
  ApiKeys,
  ApiError,
} from "./index";

describe("types/index", () => {
  it("Comment 타입이 올바른 구조를 가진다", () => {
    const comment: Comment = {
      id: "UgxB3abc",
      text: "좋은 영상 감사합니다",
      author: "홍길동",
      likeCount: 42,
      publishedAt: "2024-01-15T09:30:00Z",
    };
    expect(comment.id).toBe("UgxB3abc");
    expect(comment.likeCount).toBe(42);
  });

  it("YouTubeCommentsResponse 타입이 올바른 구조를 가진다", () => {
    const response: YouTubeCommentsResponse = {
      comments: [],
      totalResults: 1523,
      videoId: "dQw4w9WgXcQ",
    };
    expect(response.comments).toEqual([]);
    expect(response.totalResults).toBe(1523);
  });

  it("SentimentRatio 타입의 세 필드가 number이다", () => {
    const ratio: SentimentRatio = {
      positive: 65,
      neutral: 25,
      negative: 10,
    };
    expect(ratio.positive + ratio.neutral + ratio.negative).toBe(100);
  });

  it("RepresentativeComment 타입이 올바른 구조를 가진다", () => {
    const comment: RepresentativeComment = {
      text: "좋은 영상이네요",
      author: "홍길동",
    };
    expect(comment.text).toBe("좋은 영상이네요");
  });

  it("AnalysisReport 타입이 올바른 구조를 가진다", () => {
    const report: AnalysisReport = {
      summary: "전반적으로 긍정적인 반응",
      sentiment: { positive: 70, neutral: 20, negative: 10 },
      strengths: ["설명이 명확하다"],
      improvements: ["음질 개선 필요"],
      representativeComments: {
        positive: [{ text: "좋아요", author: "A" }],
        neutral: [{ text: "보통", author: "B" }],
        negative: [{ text: "별로", author: "C" }],
      },
    };
    expect(report.strengths).toHaveLength(1);
    expect(report.representativeComments.positive).toHaveLength(1);
  });

  it("AppPhase 타입이 유효한 값만 허용한다", () => {
    const phases: AppPhase[] = ["idle", "loading", "report", "error"];
    expect(phases).toHaveLength(4);
  });

  it("LoadingStep 타입이 올바른 구조를 가진다", () => {
    const step: LoadingStep = {
      label: "댓글을 수집하고 있습니다...",
      status: "active",
    };
    expect(step.status).toBe("active");
  });

  it("ApiKeys 타입이 올바른 구조를 가진다", () => {
    const keys: ApiKeys = {
      youtube: "AIza...",
      anthropic: "sk-ant-...",
    };
    expect(keys.youtube).toBeTruthy();
    expect(keys.anthropic).toBeTruthy();
  });

  it("ApiError 타입이 isApiKeyError 선택적 필드를 포함한다", () => {
    const errorWithFlag: ApiError = {
      error: "Invalid API key",
      isApiKeyError: true,
    };
    const errorWithoutFlag: ApiError = {
      error: "Rate limited",
    };
    expect(errorWithFlag.isApiKeyError).toBe(true);
    expect(errorWithoutFlag.isApiKeyError).toBeUndefined();
  });
});
