import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ReportView from "./ReportView";
import type { AnalysisReport } from "@/types";

const mockReport: AnalysisReport = {
  summary: "전반적으로 긍정적인 반응",
  sentiment: { positive: 70, neutral: 20, negative: 10 },
  strengths: ["설명이 명확하다"],
  improvements: ["음질 개선"],
  representativeComments: {
    positive: [{ text: "좋은 영상", author: "홍길동" }],
    neutral: [],
    negative: [],
  },
};

const defaultProps = {
  report: mockReport,
  commentsMeta: { analyzed: 100, total: 1523 },
  onReset: vi.fn(),
};

describe("ReportView", () => {
  it("요약 텍스트를 표시한다", () => {
    render(<ReportView {...defaultProps} />);
    expect(screen.getByText("전반적으로 긍정적인 반응")).toBeDefined();
  });

  it("ReportHeader를 렌더링한다", () => {
    render(<ReportView {...defaultProps} />);
    expect(screen.getByText("100개 댓글 분석 (전체 1,523개 중)")).toBeDefined();
  });

  it("SentimentChart를 렌더링한다", () => {
    render(<ReportView {...defaultProps} />);
    expect(screen.getByText("긍정 70%")).toBeDefined();
  });

  it("InsightCard를 렌더링한다", () => {
    render(<ReportView {...defaultProps} />);
    expect(screen.getByText("잘하고 있는 점")).toBeDefined();
    expect(screen.getByText("개선할 점")).toBeDefined();
  });

  it("CommentList를 렌더링한다", () => {
    render(<ReportView {...defaultProps} />);
    expect(screen.getByText("대표 댓글")).toBeDefined();
  });

  it("'다른 영상 분석하기' 버튼 클릭 시 onReset을 호출한다", () => {
    const onReset = vi.fn();
    render(<ReportView {...defaultProps} onReset={onReset} />);
    fireEvent.click(screen.getByText("다른 영상 분석하기"));
    expect(onReset).toHaveBeenCalledOnce();
  });
});
