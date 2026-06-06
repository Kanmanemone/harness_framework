import { describe, it, expect } from "vitest";
import { extractVideoId } from "./youtube";

describe("extractVideoId", () => {
  const VIDEO_ID = "dQw4w9WgXcQ";

  describe("youtube.com/watch?v= 패턴", () => {
    it("기본 URL", () => {
      expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(VIDEO_ID);
    });

    it("www 없는 URL", () => {
      expect(extractVideoId("https://youtube.com/watch?v=dQw4w9WgXcQ")).toBe(VIDEO_ID);
    });

    it("http URL", () => {
      expect(extractVideoId("http://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(VIDEO_ID);
    });

    it("추가 쿼리 파라미터가 있는 URL", () => {
      expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120&list=PLtest")).toBe(VIDEO_ID);
    });

    it("v 파라미터가 뒤에 있는 URL", () => {
      expect(extractVideoId("https://www.youtube.com/watch?list=PLtest&v=dQw4w9WgXcQ&index=1")).toBe(VIDEO_ID);
    });
  });

  describe("youtu.be/ 패턴", () => {
    it("기본 단축 URL", () => {
      expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(VIDEO_ID);
    });

    it("http 단축 URL", () => {
      expect(extractVideoId("http://youtu.be/dQw4w9WgXcQ")).toBe(VIDEO_ID);
    });

    it("쿼리 파라미터가 있는 단축 URL", () => {
      expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ?t=30")).toBe(VIDEO_ID);
    });
  });

  describe("youtube.com/embed/ 패턴", () => {
    it("기본 embed URL", () => {
      expect(extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(VIDEO_ID);
    });

    it("www 없는 embed URL", () => {
      expect(extractVideoId("https://youtube.com/embed/dQw4w9WgXcQ")).toBe(VIDEO_ID);
    });
  });

  describe("youtube.com/v/ 패턴", () => {
    it("기본 /v/ URL", () => {
      expect(extractVideoId("https://www.youtube.com/v/dQw4w9WgXcQ")).toBe(VIDEO_ID);
    });
  });

  describe("youtube.com/shorts/ 패턴", () => {
    it("기본 shorts URL", () => {
      expect(extractVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(VIDEO_ID);
    });

    it("쿼리 파라미터가 있는 shorts URL", () => {
      expect(extractVideoId("https://youtube.com/shorts/dQw4w9WgXcQ?feature=share")).toBe(VIDEO_ID);
    });
  });

  describe("언더스코어/하이픈이 포함된 video ID", () => {
    it("하이픈이 포함된 ID", () => {
      expect(extractVideoId("https://www.youtube.com/watch?v=abc-def_123")).toBe("abc-def_123");
    });
  });

  describe("잘못된 입력", () => {
    it("빈 문자열", () => {
      expect(extractVideoId("")).toBeNull();
    });

    it("일반 URL", () => {
      expect(extractVideoId("https://www.google.com")).toBeNull();
    });

    it("영상 ID만 입력", () => {
      expect(extractVideoId("dQw4w9WgXcQ")).toBeNull();
    });

    it("채널 URL", () => {
      expect(extractVideoId("https://www.youtube.com/channel/UCtest")).toBeNull();
    });

    it("재생목록 URL (영상 없음)", () => {
      expect(extractVideoId("https://www.youtube.com/playlist?list=PLtest")).toBeNull();
    });

    it("11자가 아닌 ID", () => {
      expect(extractVideoId("https://www.youtube.com/watch?v=short")).toBeNull();
    });

    it("특수문자가 포함된 ID", () => {
      expect(extractVideoId("https://www.youtube.com/watch?v=abc!def@123")).toBeNull();
    });
  });
});
