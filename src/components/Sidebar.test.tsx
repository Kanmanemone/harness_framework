import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "./Sidebar";
import type { HistoryEntry } from "@/types";

function makeEntry(id: string, title = `영상 분석 ${id}`): HistoryEntry {
  return {
    id,
    videoId: `vid-${id}`,
    url: `https://www.youtube.com/watch?v=vid-${id}`,
    title,
    analyzedAt: new Date().toISOString(),
    report: {
      summary: title,
      sentiment: { positive: 60, neutral: 30, negative: 10 },
      strengths: ["좋은 점"],
      improvements: ["개선 점"],
      representativeComments: { positive: [], neutral: [], negative: [] },
    },
    commentsMeta: { analyzed: 10, total: 100 },
  };
}

describe("Sidebar", () => {
  const defaultProps = {
    history: [] as HistoryEntry[],
    activeId: null as string | null,
    onSelect: vi.fn(),
    onDelete: vi.fn(),
    onClearAll: vi.fn(),
  };

  it("기록이 없으면 빈 상태 메시지를 표시한다", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("아직 분석 기록이 없습니다")).toBeDefined();
  });

  it("기록 목록을 렌더링한다", () => {
    const history = [makeEntry("1", "첫 번째 영상"), makeEntry("2", "두 번째 영상")];
    render(<Sidebar {...defaultProps} history={history} />);
    expect(screen.getByText("첫 번째 영상")).toBeDefined();
    expect(screen.getByText("두 번째 영상")).toBeDefined();
  });

  it("활성 항목에 하이라이트 스타일을 적용한다", () => {
    const history = [makeEntry("1"), makeEntry("2")];
    render(<Sidebar {...defaultProps} history={history} activeId="1" />);
    const activeItem = screen.getByText("영상 분석 1").closest("button");
    expect(activeItem?.className).toContain("bg-neutral-800");
  });

  it("항목 클릭 시 onSelect를 호출한다", () => {
    const onSelect = vi.fn();
    const history = [makeEntry("1")];
    render(<Sidebar {...defaultProps} history={history} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("영상 분석 1"));
    expect(onSelect).toHaveBeenCalledWith(history[0]);
  });

  it("삭제 버튼 클릭 시 onDelete를 호출한다", () => {
    const onDelete = vi.fn();
    const history = [makeEntry("1")];
    render(<Sidebar {...defaultProps} history={history} onDelete={onDelete} />);
    const deleteBtn = screen.getByLabelText("삭제");
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith("1");
  });

  it("삭제 버튼 클릭이 onSelect로 전파되지 않는다", () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    const history = [makeEntry("1")];
    render(<Sidebar {...defaultProps} history={history} onSelect={onSelect} onDelete={onDelete} />);
    const deleteBtn = screen.getByLabelText("삭제");
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("전체 삭제 버튼 클릭 시 onClearAll을 호출한다", () => {
    const onClearAll = vi.fn();
    const history = [makeEntry("1")];
    render(<Sidebar {...defaultProps} history={history} onClearAll={onClearAll} />);
    fireEvent.click(screen.getByText("전체 삭제"));
    expect(onClearAll).toHaveBeenCalled();
  });

  it("헤더에 '분석 기록'을 표시한다", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("분석 기록")).toBeDefined();
  });
});
