import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LoadingState from "./LoadingState";

describe("LoadingState", () => {
  const steps = [
    { label: "댓글을 수집하고 있습니다...", status: "done" as const },
    { label: "AI가 댓글을 분석하고 있습니다...", status: "active" as const },
    { label: "리포트를 생성하고 있습니다...", status: "pending" as const },
  ];

  it("모든 단계 텍스트를 표시한다", () => {
    render(<LoadingState steps={steps} />);
    expect(screen.getByText("댓글을 수집하고 있습니다...")).toBeDefined();
    expect(screen.getByText("AI가 댓글을 분석하고 있습니다...")).toBeDefined();
    expect(screen.getByText("리포트를 생성하고 있습니다...")).toBeDefined();
  });

  it("done 단계에 체크마크 SVG를 렌더링한다", () => {
    render(<LoadingState steps={steps} />);
    const doneStep = screen.getByText("댓글을 수집하고 있습니다...").parentElement!;
    const svg = doneStep.querySelector("svg");
    expect(svg?.classList.contains("text-emerald-400")).toBe(true);
  });

  it("active 단계에 스피너 SVG를 렌더링한다", () => {
    render(<LoadingState steps={steps} />);
    const activeStep = screen.getByText("AI가 댓글을 분석하고 있습니다...").parentElement!;
    const svg = activeStep.querySelector("svg");
    expect(svg?.classList.contains("animate-spin")).toBe(true);
  });

  it("pending 단계에 빈 원 SVG를 렌더링한다", () => {
    render(<LoadingState steps={steps} />);
    const pendingStep = screen.getByText("리포트를 생성하고 있습니다...").parentElement!;
    const svg = pendingStep.querySelector("svg");
    expect(svg?.classList.contains("text-neutral-700")).toBe(true);
  });
});
