import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UrlInput from "./UrlInput";

const defaultProps = {
  value: "",
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  disabled: false,
  error: null,
};

describe("UrlInput", () => {
  it("플레이스홀더를 표시한다", () => {
    render(<UrlInput {...defaultProps} />);
    expect(
      screen.getByPlaceholderText("YouTube 영상 URL을 붙여넣으세요")
    ).toBeDefined();
  });

  it("입력 변경 시 onChange를 호출한다", () => {
    const onChange = vi.fn();
    render(<UrlInput {...defaultProps} onChange={onChange} />);
    const input = screen.getByPlaceholderText("YouTube 영상 URL을 붙여넣으세요");
    fireEvent.change(input, { target: { value: "https://youtube.com/watch?v=abc" } });
    expect(onChange).toHaveBeenCalledWith("https://youtube.com/watch?v=abc");
  });

  it("Enter 키 누르면 onSubmit을 호출한다", () => {
    const onSubmit = vi.fn();
    render(
      <UrlInput {...defaultProps} value="https://youtube.com/watch?v=abc" onSubmit={onSubmit} />
    );
    const input = screen.getByPlaceholderText("YouTube 영상 URL을 붙여넣으세요");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("disabled 상태에서는 입력과 버튼이 비활성화된다", () => {
    render(<UrlInput {...defaultProps} disabled={true} value="url" />);
    const input = screen.getByPlaceholderText("YouTube 영상 URL을 붙여넣으세요") as HTMLInputElement;
    const button = screen.getByText("분석") as HTMLButtonElement;
    expect(input.disabled).toBe(true);
    expect(button.disabled).toBe(true);
  });

  it("에러가 있으면 에러 메시지를 표시한다", () => {
    render(<UrlInput {...defaultProps} error="유효한 URL을 입력해주세요" />);
    expect(screen.getByText("유효한 URL을 입력해주세요")).toBeDefined();
  });

  it("빈 값이면 버튼이 비활성화된다", () => {
    render(<UrlInput {...defaultProps} value="" />);
    const button = screen.getByText("분석") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("값이 있으면 버튼이 활성화된다", () => {
    render(<UrlInput {...defaultProps} value="something" />);
    const button = screen.getByText("분석") as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });
});
