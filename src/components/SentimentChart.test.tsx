import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SentimentChart from "./SentimentChart";

describe("SentimentChart", () => {
  it("세 세그먼트의 레이블을 퍼센트와 함께 표시한다", () => {
    render(
      <SentimentChart sentiment={{ positive: 65, neutral: 25, negative: 10 }} />
    );
    expect(screen.getByText("긍정 65%")).toBeDefined();
    expect(screen.getByText("중립 25%")).toBeDefined();
    expect(screen.getByText("부정 10%")).toBeDefined();
  });

  it("0%인 세그먼트는 바에 렌더링하지 않는다", () => {
    render(
      <SentimentChart sentiment={{ positive: 80, neutral: 20, negative: 0 }} />
    );
    expect(screen.queryByTestId("bar-negative")).toBeNull();
    expect(screen.getByTestId("bar-positive")).toBeDefined();
    expect(screen.getByTestId("bar-neutral")).toBeDefined();
  });

  it("0%가 아닌 세그먼트는 최소 2% 너비로 표시한다", () => {
    render(
      <SentimentChart sentiment={{ positive: 97, neutral: 2, negative: 1 }} />
    );
    const negBar = screen.getByTestId("bar-negative");
    expect(negBar.style.width).toBe("2%");
  });

  it("0% 레이블도 표시한다", () => {
    render(
      <SentimentChart sentiment={{ positive: 80, neutral: 20, negative: 0 }} />
    );
    expect(screen.getByText("부정 0%")).toBeDefined();
  });
});
