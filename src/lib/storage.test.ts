import { describe, it, expect, beforeEach, vi } from "vitest";
import { getApiKeys, saveApiKeys, deleteApiKey, isStorageAvailable } from "./storage";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getApiKeys", () => {
    it("키가 없으면 빈 문자열을 반환한다", () => {
      const keys = getApiKeys();
      expect(keys.youtube).toBe("");
      expect(keys.anthropic).toBe("");
    });

    it("저장된 키를 반환한다", () => {
      localStorage.setItem("yt-sentiment-youtube-key", "yt-key-123");
      localStorage.setItem("yt-sentiment-anthropic-key", "sk-ant-456");
      const keys = getApiKeys();
      expect(keys.youtube).toBe("yt-key-123");
      expect(keys.anthropic).toBe("sk-ant-456");
    });

    it("localStorage 접근 실패 시 빈 문자열을 반환한다", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Access denied");
      });
      const keys = getApiKeys();
      expect(keys.youtube).toBe("");
      expect(keys.anthropic).toBe("");
      vi.restoreAllMocks();
    });
  });

  describe("saveApiKeys", () => {
    it("두 키를 localStorage에 저장한다", () => {
      saveApiKeys({ youtube: "yt-key", anthropic: "ant-key" });
      expect(localStorage.getItem("yt-sentiment-youtube-key")).toBe("yt-key");
      expect(localStorage.getItem("yt-sentiment-anthropic-key")).toBe("ant-key");
    });

    it("localStorage 접근 실패 시 에러를 무시한다", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceeded");
      });
      expect(() => saveApiKeys({ youtube: "a", anthropic: "b" })).not.toThrow();
      vi.restoreAllMocks();
    });
  });

  describe("deleteApiKey", () => {
    it("youtube 키를 삭제한다", () => {
      localStorage.setItem("yt-sentiment-youtube-key", "yt-key");
      deleteApiKey("youtube");
      expect(localStorage.getItem("yt-sentiment-youtube-key")).toBeNull();
    });

    it("anthropic 키를 삭제한다", () => {
      localStorage.setItem("yt-sentiment-anthropic-key", "ant-key");
      deleteApiKey("anthropic");
      expect(localStorage.getItem("yt-sentiment-anthropic-key")).toBeNull();
    });

    it("localStorage 접근 실패 시 에러를 무시한다", () => {
      vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
        throw new Error("Access denied");
      });
      expect(() => deleteApiKey("youtube")).not.toThrow();
      vi.restoreAllMocks();
    });
  });

  describe("isStorageAvailable", () => {
    it("localStorage가 사용 가능하면 true를 반환한다", () => {
      expect(isStorageAvailable()).toBe(true);
    });

    it("localStorage 접근 실패 시 false를 반환한다", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("Access denied");
      });
      expect(isStorageAvailable()).toBe(false);
      vi.restoreAllMocks();
    });
  });

  describe("SSR 환경", () => {
    it("window가 없는 환경에서 getApiKeys는 빈 문자열을 반환한다", () => {
      const originalWindow = globalThis.window;
      // @ts-expect-error - SSR 환경 시뮬레이션
      delete globalThis.window;
      const keys = getApiKeys();
      expect(keys.youtube).toBe("");
      expect(keys.anthropic).toBe("");
      globalThis.window = originalWindow;
    });
  });
});
