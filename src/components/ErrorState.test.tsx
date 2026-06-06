import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorState from "./ErrorState";

describe("ErrorState", () => {
  it("에러 메시지를 표시한다", () => {
    render(
      <ErrorState message="오류가 발생했습니다" onRetry={() => {}} onReset={() => {}} />
    );
    expect(screen.getByText("오류가 발생했습니다")).toBeDefined();
  });

  it("'다시 시도' 클릭 시 onRetry를 호출한다", () => {
    const onRetry = vi.fn();
    render(
      <ErrorState message="에러" onRetry={onRetry} onReset={() => {}} />
    );
    fireEvent.click(screen.getByText("다시 시도"));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("'다른 영상 분석하기' 클릭 시 onReset을 호출한다", () => {
    const onReset = vi.fn();
    render(
      <ErrorState message="에러" onRetry={() => {}} onReset={onReset} />
    );
    fireEvent.click(screen.getByText("다른 영상 분석하기"));
    expect(onReset).toHaveBeenCalledOnce();
  });
});
