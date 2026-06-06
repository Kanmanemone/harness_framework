import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ReportHeader from "./ReportHeader";

describe("ReportHeader", () => {
  it("댓글 수를 포맷팅하여 표시한다", () => {
    render(<ReportHeader analyzed={100} total={1523} />);
    expect(screen.getByText("100개 댓글 분석 (전체 1,523개 중)")).toBeDefined();
  });

  it("1000 미만 숫자는 쉼표 없이 표시한다", () => {
    render(<ReportHeader analyzed={50} total={200} />);
    expect(screen.getByText("50개 댓글 분석 (전체 200개 중)")).toBeDefined();
  });
});
