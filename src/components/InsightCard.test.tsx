import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import InsightCard from "./InsightCard";

describe("InsightCard", () => {
  it("positive variant로 제목과 항목을 렌더링한다", () => {
    render(
      <InsightCard
        title="잘하고 있는 점"
        items={["설명이 명확하다", "편집이 깔끔하다"]}
        variant="positive"
      />
    );
    expect(screen.getByText("잘하고 있는 점")).toBeDefined();
    expect(screen.getByText("설명이 명확하다")).toBeDefined();
    expect(screen.getByText("편집이 깔끔하다")).toBeDefined();
  });

  it("negative variant로 제목을 렌더링한다", () => {
    render(
      <InsightCard
        title="개선할 점"
        items={["음질 개선"]}
        variant="negative"
      />
    );
    const title = screen.getByText("개선할 점");
    expect(title.className).toContain("text-red-400");
  });

  it("positive variant 제목에 emerald 색상을 적용한다", () => {
    render(
      <InsightCard
        title="잘하고 있는 점"
        items={["좋음"]}
        variant="positive"
      />
    );
    const title = screen.getByText("잘하고 있는 점");
    expect(title.className).toContain("text-emerald-400");
  });

  it("빈 배열이면 렌더링하지 않는다", () => {
    const { container } = render(
      <InsightCard title="잘하고 있는 점" items={[]} variant="positive" />
    );
    expect(container.innerHTML).toBe("");
  });
});
