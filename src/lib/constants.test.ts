import { describe, it, expect } from "vitest";
import {
  buildAnalysisPrompt,
  mapErrorMessage,
  isApiKeyError,
  GEMINI_MODEL,
  GEMINI_MAX_TOKENS,
  YOUTUBE_TIMEOUT_MS,
  GEMINI_TIMEOUT_MS,
} from "./constants";
import type { Comment } from "@/types";

describe("constants", () => {
  describe("상수 값", () => {
    it("GEMINI_MODEL", () => {
      expect(GEMINI_MODEL).toBe("gemini-2.5-flash");
    });

    it("GEMINI_MAX_TOKENS", () => {
      expect(GEMINI_MAX_TOKENS).toBe(8192);
    });

    it("YOUTUBE_TIMEOUT_MS", () => {
      expect(YOUTUBE_TIMEOUT_MS).toBe(15000);
    });

    it("GEMINI_TIMEOUT_MS", () => {
      expect(GEMINI_TIMEOUT_MS).toBe(60000);
    });
  });

  describe("buildAnalysisPrompt", () => {
    const comments: Comment[] = [
      { id: "1", text: "좋은 영상 감사합니다", author: "홍길동", likeCount: 42, publishedAt: "2024-01-15T09:30:00Z" },
      { id: "2", text: "음질이 좀 아쉽네요", author: "김철수", likeCount: 15, publishedAt: "2024-01-16T10:00:00Z" },
    ];

    it("댓글 수를 포함한다", () => {
      const prompt = buildAnalysisPrompt(comments);
      expect(prompt).toContain("2 comments");
    });

    it("댓글을 [번호] (작성자, Likes: N) 텍스트 형식으로 나열한다", () => {
      const prompt = buildAnalysisPrompt(comments);
      expect(prompt).toContain("[1] (홍길동, Likes: 42) 좋은 영상 감사합니다");
      expect(prompt).toContain("[2] (김철수, Likes: 15) 음질이 좀 아쉽네요");
    });

    it("JSON 스키마 구조를 포함한다", () => {
      const prompt = buildAnalysisPrompt(comments);
      expect(prompt).toContain('"summary"');
      expect(prompt).toContain('"sentiment"');
      expect(prompt).toContain('"strengths"');
      expect(prompt).toContain('"improvements"');
      expect(prompt).toContain('"representativeComments"');
    });

    it("Return ONLY the JSON 지시를 포함한다", () => {
      const prompt = buildAnalysisPrompt(comments);
      expect(prompt).toContain("Return ONLY the JSON object, nothing else");
    });

    it("sentiment percentages must sum to 100 규칙을 포함한다", () => {
      const prompt = buildAnalysisPrompt(comments);
      expect(prompt).toContain("sentiment percentages must sum to 100");
    });

    it("언어 자동 대응 규칙을 포함한다", () => {
      const prompt = buildAnalysisPrompt(comments);
      expect(prompt).toContain("write the analysis in that same language");
    });
  });

  describe("mapErrorMessage", () => {
    it("commentsDisabled 에러를 매핑한다", () => {
      expect(mapErrorMessage("commentsDisabled")).toBe("이 영상은 댓글이 비활성화되어 있습니다.");
    });

    it("quotaExceeded 에러를 매핑한다", () => {
      expect(mapErrorMessage("quotaExceeded")).toBe("YouTube API 일일 할당량을 초과했습니다. 내일 다시 시도해 주세요.");
    });

    it("videoNotFound 에러를 매핑한다", () => {
      expect(mapErrorMessage("videoNotFound")).toBe("영상을 찾을 수 없습니다. URL을 확인해 주세요.");
    });

    it("Invalid Gemini API key 에러를 매핑한다", () => {
      expect(mapErrorMessage("Invalid Gemini API key")).toBe("Gemini API 키가 유효하지 않습니다. 키를 확인해 주세요.");
    });

    it("Gemini API quota exceeded 에러를 매핑한다", () => {
      expect(mapErrorMessage("Gemini API quota exceeded")).toBe("Gemini API 할당량을 초과했습니다. 잠시 후 다시 시도해 주세요.");
    });

    it("Rate limited 에러를 매핑한다", () => {
      expect(mapErrorMessage("Rate limited")).toBe("요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
    });

    it("AI service temporarily unavailable 에러를 매핑한다", () => {
      expect(mapErrorMessage("AI service temporarily unavailable")).toBe("AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.");
    });

    it("AI service timeout 에러를 매핑한다", () => {
      expect(mapErrorMessage("AI service timeout")).toBe("AI 응답이 너무 오래 걸립니다. 다시 시도해 주세요.");
    });

    it("YouTube API timeout 에러를 매핑한다", () => {
      expect(mapErrorMessage("YouTube API timeout")).toBe("YouTube 응답이 너무 오래 걸립니다. 다시 시도해 주세요.");
    });

    it("Failed to parse analysis result 에러를 매핑한다", () => {
      expect(mapErrorMessage("Failed to parse analysis result")).toBe("분석 결과를 처리하지 못했습니다. 다시 시도해 주세요.");
    });

    it("Failed to reach YouTube API 에러를 매핑한다", () => {
      expect(mapErrorMessage("Failed to reach YouTube API")).toBe("YouTube 서비스에 연결할 수 없습니다. 네트워크를 확인해 주세요.");
    });

    it("Failed to reach AI service 에러를 매핑한다", () => {
      expect(mapErrorMessage("Failed to reach AI service")).toBe("AI 서비스에 연결할 수 없습니다. 네트워크를 확인해 주세요.");
    });

    it("알 수 없는 에러 코드는 기본 메시지를 반환한다", () => {
      expect(mapErrorMessage("unknown_error_xyz")).toBe("예기치 않은 오류가 발생했습니다. 다시 시도해 주세요.");
    });
  });

  describe("isApiKeyError", () => {
    it("Invalid Gemini API key는 true를 반환한다", () => {
      expect(isApiKeyError("Invalid Gemini API key")).toBe(true);
    });

    it("YouTube API error는 true를 반환한다", () => {
      expect(isApiKeyError("YouTube API error")).toBe(true);
    });

    it("quotaExceeded는 false를 반환한다", () => {
      expect(isApiKeyError("quotaExceeded")).toBe(false);
    });

    it("Rate limited는 false를 반환한다", () => {
      expect(isApiKeyError("Rate limited")).toBe(false);
    });

    it("알 수 없는 에러는 false를 반환한다", () => {
      expect(isApiKeyError("some_random_error")).toBe(false);
    });
  });
});
