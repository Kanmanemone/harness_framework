import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ApiKeySettings from "./ApiKeySettings";

const defaultProps = {
  open: true,
  onToggle: vi.fn(),
  onSave: vi.fn(),
  onDelete: vi.fn(),
  savedKeys: { youtube: "", anthropic: "" },
  storageAvailable: true,
};

describe("ApiKeySettings", () => {
  it("open이 false이면 렌더링하지 않는다", () => {
    const { container } = render(
      <ApiKeySettings {...defaultProps} open={false} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("open이 true이면 패널을 렌더링한다", () => {
    render(<ApiKeySettings {...defaultProps} />);
    expect(screen.getByText("YouTube API 키")).toBeDefined();
    expect(screen.getByText("Anthropic API 키")).toBeDefined();
    expect(screen.getByText("저장")).toBeDefined();
  });

  it("키가 저장된 상태이면 마스킹된 값과 삭제 버튼을 표시한다", () => {
    render(
      <ApiKeySettings
        {...defaultProps}
        savedKeys={{ youtube: "AIzaSyAbcdefghijklmnop", anthropic: "" }}
      />
    );
    expect(screen.getByText("AIzaSy...mnop")).toBeDefined();
    expect(screen.getByText("삭제")).toBeDefined();
  });

  it("키가 없으면 미설정을 표시한다", () => {
    render(<ApiKeySettings {...defaultProps} />);
    const labels = screen.getAllByText("미설정");
    expect(labels.length).toBe(2);
  });

  it("저장 버튼 클릭 시 onSave를 호출한다", () => {
    const onSave = vi.fn();
    render(<ApiKeySettings {...defaultProps} onSave={onSave} />);

    const inputs = screen.getAllByPlaceholderText("API 키 입력");
    fireEvent.change(inputs[0], { target: { value: "yt-key" } });
    fireEvent.change(inputs[1], { target: { value: "ant-key" } });
    fireEvent.click(screen.getByText("저장"));

    expect(onSave).toHaveBeenCalledWith({
      youtube: "yt-key",
      anthropic: "ant-key",
    });
  });

  it("삭제 버튼 클릭 시 onDelete를 호출한다", () => {
    const onDelete = vi.fn();
    render(
      <ApiKeySettings
        {...defaultProps}
        onDelete={onDelete}
        savedKeys={{ youtube: "some-youtube-key-here", anthropic: "" }}
      />
    );
    fireEvent.click(screen.getByText("삭제"));
    expect(onDelete).toHaveBeenCalledWith("youtube");
  });

  it("storageAvailable이 false이면 시크릿 모드 안내를 표시한다", () => {
    render(<ApiKeySettings {...defaultProps} storageAvailable={false} />);
    expect(
      screen.getByText("시크릿 모드에서는 API 키가 저장되지 않습니다.")
    ).toBeDefined();
  });

  it("외부 링크에 target과 rel 속성이 있다", () => {
    render(<ApiKeySettings {...defaultProps} />);
    const googleLink = screen.getByText("Google Cloud Console");
    expect(googleLink.getAttribute("target")).toBe("_blank");
    expect(googleLink.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
