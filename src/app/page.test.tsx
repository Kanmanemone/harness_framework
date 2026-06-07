import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "./page";

// Mock services
vi.mock("@/services/youtubeService", () => ({
  fetchComments: vi.fn(),
}));

vi.mock("@/services/analyzeService", () => ({
  analyzeComments: vi.fn(),
}));

// Mock storage
vi.mock("@/lib/storage", () => ({
  getApiKeys: vi.fn(() => ({ youtube: "", gemini: "" })),
  saveApiKeys: vi.fn(),
  deleteApiKey: vi.fn(),
  isStorageAvailable: vi.fn(() => true),
}));

import { fetchComments } from "@/services/youtubeService";
import { analyzeComments } from "@/services/analyzeService";
import { getApiKeys } from "@/lib/storage";

const mockFetchComments = vi.mocked(fetchComments);
const mockAnalyzeComments = vi.mocked(analyzeComments);
const mockGetApiKeys = vi.mocked(getApiKeys);

// Helper to mock global fetch for env-keys endpoint
function mockEnvKeys(envKeys: { youtube: boolean; gemini: boolean }) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((url: string) => {
      if (url === "/api/env-keys") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(envKeys),
        });
      }
      return Promise.reject(new Error(`Unmocked fetch: ${url}`));
    })
  );
}

const mockReport = {
  summary: "전반적으로 긍정적",
  sentiment: { positive: 70, neutral: 20, negative: 10 },
  strengths: ["좋은 점"],
  improvements: ["개선 점"],
  representativeComments: {
    positive: [{ text: "좋아요", author: "A" }],
    neutral: [],
    negative: [],
  },
};

describe("Home (page.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetApiKeys.mockReturnValue({ youtube: "", gemini: "" });
  });

  it("API 키가 없으면 설정 패널이 열린다", async () => {
    mockEnvKeys({ youtube: false, gemini: false });
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("YouTube API 키")).toBeDefined();
      expect(screen.getByText("Gemini API 키")).toBeDefined();
    });
  });

  it("API 키가 있으면 설정 패널이 닫힌다", () => {
    mockGetApiKeys.mockReturnValue({ youtube: "yt-key", gemini: "ant-key" });
    render(<Home />);
    expect(screen.queryByText("YouTube API 키")).toBeNull();
  });

  it("초기 상태에서 EmptyState를 표시한다", () => {
    render(<Home />);
    expect(
      screen.getByText("시청자 반응 리포트를 생성합니다.", { exact: false })
    ).toBeDefined();
  });

  it("잘못된 URL 입력 시 인라인 에러를 표시한다", () => {
    mockGetApiKeys.mockReturnValue({ youtube: "yt", gemini: "ant" });
    render(<Home />);

    const input = screen.getByPlaceholderText("YouTube 영상 URL을 붙여넣으세요");
    fireEvent.change(input, { target: { value: "invalid-url" } });
    fireEvent.click(screen.getByText("분석"));

    expect(
      screen.getByText("유효한 YouTube URL을 입력해 주세요.", { exact: false })
    ).toBeDefined();
  });

  it("API 키 미설정 시 인라인 에러 + 설정 패널 열기", () => {
    mockGetApiKeys.mockReturnValue({ youtube: "", gemini: "" });
    render(<Home />);

    const input = screen.getByPlaceholderText("YouTube 영상 URL을 붙여넣으세요");
    fireEvent.change(input, {
      target: { value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    });
    fireEvent.click(screen.getByText("분석"));

    expect(
      screen.getByText("API 키를 먼저 설정해 주세요.")
    ).toBeDefined();
    expect(screen.getByText("YouTube API 키")).toBeDefined();
  });

  it("URL 수정 시 인라인 에러가 제거된다", () => {
    mockGetApiKeys.mockReturnValue({ youtube: "yt", gemini: "ant" });
    render(<Home />);

    const input = screen.getByPlaceholderText("YouTube 영상 URL을 붙여넣으세요");
    fireEvent.change(input, { target: { value: "invalid" } });
    fireEvent.click(screen.getByText("분석"));
    expect(
      screen.getByText("유효한 YouTube URL을 입력해 주세요.", { exact: false })
    ).toBeDefined();

    fireEvent.change(input, { target: { value: "new-value" } });
    expect(
      screen.queryByText("유효한 YouTube URL을 입력해 주세요.", { exact: false })
    ).toBeNull();
  });

  it("정상 분석 흐름: 리포트가 표시된다", async () => {
    mockGetApiKeys.mockReturnValue({ youtube: "yt-key", gemini: "ant-key" });
    mockFetchComments.mockResolvedValue({
      comments: [
        { id: "1", text: "좋아요", author: "A", likeCount: 5, publishedAt: "2024-01-01T00:00:00Z" },
      ],
      totalResults: 100,
      videoId: "dQw4w9WgXcQ",
    });
    mockAnalyzeComments.mockResolvedValue(mockReport);

    render(<Home />);

    const input = screen.getByPlaceholderText("YouTube 영상 URL을 붙여넣으세요");
    fireEvent.change(input, {
      target: { value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    });
    fireEvent.click(screen.getByText("분석"));

    await waitFor(() => {
      expect(screen.getByText("전반적으로 긍정적")).toBeDefined();
    });
  });

  it("에러 흐름: fetchComments 실패 시 에러를 표시한다", async () => {
    mockGetApiKeys.mockReturnValue({ youtube: "yt-key", gemini: "ant-key" });
    mockFetchComments.mockRejectedValue(new Error("commentsDisabled"));

    render(<Home />);

    const input = screen.getByPlaceholderText("YouTube 영상 URL을 붙여넣으세요");
    fireEvent.change(input, {
      target: { value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    });
    fireEvent.click(screen.getByText("분석"));

    await waitFor(() => {
      expect(
        screen.getByText("이 영상은 댓글이 비활성화되어 있습니다.")
      ).toBeDefined();
    });
  });

  it("API 키 에러 시 설정 패널이 열린다", async () => {
    mockGetApiKeys.mockReturnValue({ youtube: "yt-key", gemini: "ant-key" });
    mockFetchComments.mockRejectedValue(
      new Error("Invalid Gemini API key")
    );

    render(<Home />);

    const input = screen.getByPlaceholderText("YouTube 영상 URL을 붙여넣으세요");
    fireEvent.change(input, {
      target: { value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    });
    fireEvent.click(screen.getByText("분석"));

    await waitFor(() => {
      expect(screen.getByText("YouTube API 키")).toBeDefined();
    });
  });

  it("'다시 시도' 클릭 시 재분석한다", async () => {
    mockGetApiKeys.mockReturnValue({ youtube: "yt-key", gemini: "ant-key" });
    mockFetchComments.mockRejectedValueOnce(new Error("commentsDisabled"));

    render(<Home />);

    const input = screen.getByPlaceholderText("YouTube 영상 URL을 붙여넣으세요");
    fireEvent.change(input, {
      target: { value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    });
    fireEvent.click(screen.getByText("분석"));

    await waitFor(() => {
      expect(screen.getByText("다시 시도")).toBeDefined();
    });

    mockFetchComments.mockResolvedValueOnce({
      comments: [
        { id: "1", text: "좋아요", author: "A", likeCount: 5, publishedAt: "2024-01-01T00:00:00Z" },
      ],
      totalResults: 100,
      videoId: "dQw4w9WgXcQ",
    });
    mockAnalyzeComments.mockResolvedValueOnce(mockReport);

    fireEvent.click(screen.getByText("다시 시도"));

    await waitFor(() => {
      expect(screen.getByText("전반적으로 긍정적")).toBeDefined();
    });
  });

  it("'다른 영상 분석하기' 클릭 시 idle 상태로 돌아간다", async () => {
    mockGetApiKeys.mockReturnValue({ youtube: "yt-key", gemini: "ant-key" });
    mockFetchComments.mockRejectedValueOnce(new Error("commentsDisabled"));

    render(<Home />);

    const input = screen.getByPlaceholderText("YouTube 영상 URL을 붙여넣으세요");
    fireEvent.change(input, {
      target: { value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    });
    fireEvent.click(screen.getByText("분석"));

    await waitFor(() => {
      expect(screen.getByText("다른 영상 분석하기")).toBeDefined();
    });

    fireEvent.click(screen.getByText("다른 영상 분석하기"));

    expect(
      screen.getByText("시청자 반응 리포트를 생성합니다.", { exact: false })
    ).toBeDefined();
  });

  describe("env 키 폴백", () => {
    it("env 키가 모두 있으면 localStorage 키 없이도 설정 패널이 닫힌다", async () => {
      mockGetApiKeys.mockReturnValue({ youtube: "", gemini: "" });
      mockEnvKeys({ youtube: true, gemini: true });

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText("YouTube API 키")).toBeNull();
      });
    });

    it("env 키가 모두 있으면 빈 키로 분석 가능", async () => {
      mockGetApiKeys.mockReturnValue({ youtube: "", gemini: "" });
      mockEnvKeys({ youtube: true, gemini: true });
      mockFetchComments.mockResolvedValue({
        comments: [
          { id: "1", text: "좋아요", author: "A", likeCount: 5, publishedAt: "2024-01-01T00:00:00Z" },
        ],
        totalResults: 100,
        videoId: "dQw4w9WgXcQ",
      });
      mockAnalyzeComments.mockResolvedValue(mockReport);

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText("YouTube API 키")).toBeNull();
      });

      const input = screen.getByPlaceholderText("YouTube 영상 URL을 붙여넣으세요");
      fireEvent.change(input, {
        target: { value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      });
      fireEvent.click(screen.getByText("분석"));

      await waitFor(() => {
        expect(screen.getByText("전반적으로 긍정적")).toBeDefined();
      });

      // env 키가 있는 필드는 빈 문자열로 전달
      expect(mockFetchComments).toHaveBeenCalledWith("dQw4w9WgXcQ", "");
      expect(mockAnalyzeComments).toHaveBeenCalledWith(
        expect.any(Array),
        ""
      );
    });

    it("env에 youtube만 있고 gemini는 localStorage에서 → 혼합 사용", async () => {
      mockGetApiKeys.mockReturnValue({ youtube: "", gemini: "local-gemini" });
      mockEnvKeys({ youtube: true, gemini: false });

      render(<Home />);

      await waitFor(() => {
        expect(screen.queryByText("YouTube API 키")).toBeNull();
      });
    });

    it("env 키 없고 localStorage 키도 없으면 설정 패널 열림", async () => {
      mockGetApiKeys.mockReturnValue({ youtube: "", gemini: "" });
      mockEnvKeys({ youtube: false, gemini: false });

      render(<Home />);

      // 설정 패널이 열려 있어야 함
      await waitFor(() => {
        expect(screen.getByText("YouTube API 키")).toBeDefined();
      });
    });
  });
});
