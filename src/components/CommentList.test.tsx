import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CommentList from "./CommentList";

const fullComments = {
  positive: [{ text: "좋은 영상", author: "홍길동" }],
  neutral: [{ text: "보통이다", author: "김철수" }],
  negative: [{ text: "별로다", author: "이영희" }],
};

describe("CommentList", () => {
  it("섹션 제목 '대표 댓글'을 표시한다", () => {
    render(<CommentList comments={fullComments} />);
    expect(screen.getByText("대표 댓글")).toBeDefined();
  });

  it("세 센티먼트 그룹의 뱃지를 모두 표시한다", () => {
    render(<CommentList comments={fullComments} />);
    expect(screen.getByText("긍정")).toBeDefined();
    expect(screen.getByText("중립")).toBeDefined();
    expect(screen.getByText("부정")).toBeDefined();
  });

  it("댓글 텍스트와 작성자를 표시한다", () => {
    render(<CommentList comments={fullComments} />);
    expect(screen.getByText("좋은 영상")).toBeDefined();
    expect(screen.getByText("홍길동", { exact: false })).toBeDefined();
  });

  it("빈 그룹은 렌더링하지 않는다", () => {
    const comments = {
      positive: [{ text: "좋아요", author: "A" }],
      neutral: [],
      negative: [],
    };
    render(<CommentList comments={comments} />);
    expect(screen.getByText("긍정")).toBeDefined();
    expect(screen.queryByText("중립")).toBeNull();
    expect(screen.queryByText("부정")).toBeNull();
  });
});
