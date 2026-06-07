import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";

const VALID_API_KEY = "test-gemini-key-123";

const sampleComments = [
  { id: "c1", text: "좋은 영상 감사합니다", author: "유저A", likeCount: 42, publishedAt: "2024-01-15T09:30:00Z" },
  { id: "c2", text: "음질이 좀 아쉽네요", author: "유저B", likeCount: 15, publishedAt: "2024-01-16T10:00:00Z" },
];

const validReport = {
  summary: "전반적으로 긍정적인 반응",
  sentiment: { positive: 60, neutral: 30, negative: 10 },
  strengths: ["설명이 명확하다"],
  improvements: ["음질 개선 필요"],
  representativeComments: {
    positive: [{ text: "좋은 영상 감사합니다", author: "유저A" }],
    neutral: [],
    negative: [{ text: "음질이 좀 아쉽네요", author: "유저B" }],
  },
};

function makeRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeGeminiResponse(text: string) {
  return {
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        candidates: [{ content: { parts: [{ text }] } }],
      }),
  };
}

function makeGeminiErrorResponse(status: number, message: string, errorStatus = "INVALID_ARGUMENT") {
  return {
    ok: false,
    status,
    json: () =>
      Promise.resolve({
        error: { code: status, message, status: errorStatus },
      }),
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/analyze", () => {
  describe("정상 응답", () => {
    it("유효한 JSON → 200 + AnalysisReport", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(makeGeminiResponse(JSON.stringify(validReport)))
      );

      const res = await POST(makeRequest({ comments: sampleComments, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.summary).toBe(validReport.summary);
      expect(body.sentiment).toEqual(validReport.sentiment);
      expect(body.strengths).toEqual(validReport.strengths);
      expect(body.improvements).toEqual(validReport.improvements);
      expect(body.representativeComments).toEqual(validReport.representativeComments);
    });

    it("코드 펜스로 감싼 JSON → 200 (방어 코드가 제거)", async () => {
      const wrapped = "```json\n" + JSON.stringify(validReport) + "\n```";
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(makeGeminiResponse(wrapped))
      );

      const res = await POST(makeRequest({ comments: sampleComments, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.summary).toBe(validReport.summary);
    });

    it("JSON 앞뒤에 텍스트 포함 → 200 (방어 코드가 추출)", async () => {
      const withText = "Here is the analysis:\n" + JSON.stringify(validReport) + "\nDone.";
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(makeGeminiResponse(withText))
      );

      const res = await POST(makeRequest({ comments: sampleComments, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.summary).toBe(validReport.summary);
    });
  });

  describe("파라미터 누락", () => {
    it("comments 없음 → 400", async () => {
      const res = await POST(makeRequest({ apiKey: VALID_API_KEY }));
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe("Missing comments or apiKey");
    });

    it("apiKey 없음 + env 없음 → 400", async () => {
      delete process.env.GEMINI_API_KEY;
      const res = await POST(makeRequest({ comments: sampleComments }));
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe("Missing comments or apiKey");
    });

    it("comments가 빈 배열 → 400", async () => {
      const res = await POST(makeRequest({ comments: [], apiKey: VALID_API_KEY }));
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe("No comments to analyze");
    });
  });

  describe("env 폴백", () => {
    it("apiKey 미전달 + GEMINI_API_KEY env 설정 → env 키로 요청", async () => {
      process.env.GEMINI_API_KEY = "env-gemini-key";
      const mockFetch = vi.fn().mockResolvedValue(makeGeminiResponse(JSON.stringify(validReport)));
      vi.stubGlobal("fetch", mockFetch);

      const res = await POST(makeRequest({ comments: sampleComments }));
      expect(res.status).toBe(200);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("key=env-gemini-key");
    });

    it("apiKey 빈 문자열 + GEMINI_API_KEY env 설정 → env 키로 요청", async () => {
      process.env.GEMINI_API_KEY = "env-gemini-key";
      const mockFetch = vi.fn().mockResolvedValue(makeGeminiResponse(JSON.stringify(validReport)));
      vi.stubGlobal("fetch", mockFetch);

      const res = await POST(makeRequest({ comments: sampleComments, apiKey: "" }));
      expect(res.status).toBe(200);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("key=env-gemini-key");
    });

    it("apiKey 전달 시 env보다 우선", async () => {
      process.env.GEMINI_API_KEY = "env-gemini-key";
      const mockFetch = vi.fn().mockResolvedValue(makeGeminiResponse(JSON.stringify(validReport)));
      vi.stubGlobal("fetch", mockFetch);

      const res = await POST(makeRequest({ comments: sampleComments, apiKey: "user-key" }));
      expect(res.status).toBe(200);

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("key=user-key");
      expect(calledUrl).not.toContain("key=env-gemini-key");
    });

    afterEach(() => {
      delete process.env.GEMINI_API_KEY;
    });
  });

  describe("Gemini API 에러", () => {
    it("API key not valid → 401 + isApiKeyError: true", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeGeminiErrorResponse(400, "API key not valid. Please pass a valid API key.", "INVALID_ARGUMENT")
        )
      );

      const res = await POST(makeRequest({ comments: sampleComments, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.error).toBe("Invalid Gemini API key");
      expect(body.isApiKeyError).toBe(true);
    });

    it("429 rate limit → 429 + Rate limited", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeGeminiErrorResponse(429, "Resource has been exhausted", "RESOURCE_EXHAUSTED")
        )
      );

      const res = await POST(makeRequest({ comments: sampleComments, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(429);

      const body = await res.json();
      expect(body.error).toBe("Rate limited");
    });

    it("429 quota exceeded → 429 + quota error", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeGeminiErrorResponse(429, "Quota exceeded for quota metric", "RESOURCE_EXHAUSTED")
        )
      );

      const res = await POST(makeRequest({ comments: sampleComments, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(429);

      const body = await res.json();
      expect(body.error).toBe("Gemini API quota exceeded");
    });

    it("429 credits depleted → 429 + credits error", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeGeminiErrorResponse(429, "Your prepayment credits are depleted.", "RESOURCE_EXHAUSTED")
        )
      );

      const res = await POST(makeRequest({ comments: sampleComments, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(429);

      const body = await res.json();
      expect(body.error).toBe("Gemini credits depleted");
    });

    it("500 (INTERNAL) → 502", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeGeminiErrorResponse(500, "Internal error", "INTERNAL")
        )
      );

      const res = await POST(makeRequest({ comments: sampleComments, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(502);

      const body = await res.json();
      expect(body.error).toBe("AI service temporarily unavailable");
      expect(body.isApiKeyError).toBeUndefined();
    });
  });

  describe("JSON 파싱 실패", () => {
    it("완전히 비정형 텍스트 → 500", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeGeminiResponse("I cannot analyze these comments because they are inappropriate.")
        )
      );

      const res = await POST(makeRequest({ comments: sampleComments, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe("Failed to parse analysis result");
    });
  });

  describe("네트워크/타임아웃 에러", () => {
    it("타임아웃 → 504", async () => {
      const abortError = new DOMException("The operation was aborted", "AbortError");
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

      const res = await POST(makeRequest({ comments: sampleComments, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(504);

      const body = await res.json();
      expect(body.error).toBe("AI service timeout");
    });

    it("네트워크 실패 → 502", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

      const res = await POST(makeRequest({ comments: sampleComments, apiKey: VALID_API_KEY }));
      expect(res.status).toBe(502);

      const body = await res.json();
      expect(body.error).toBe("Failed to reach AI service");
    });
  });
});
