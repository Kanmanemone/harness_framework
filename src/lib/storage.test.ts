import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getApiKeys, saveApiKeys, deleteApiKey, isStorageAvailable,
  getHistory, addHistoryEntry, deleteHistoryEntry, clearHistory,
} from "./storage";
import type { HistoryEntry } from "@/types";

function makeEntry(id: string): HistoryEntry {
  return {
    id,
    videoId: `vid-${id}`,
    url: `https://www.youtube.com/watch?v=vid-${id}`,
    title: `테스트 영상 ${id}`,
    analyzedAt: new Date().toISOString(),
    report: {
      summary: `요약 ${id}`,
      sentiment: { positive: 60, neutral: 30, negative: 10 },
      strengths: ["좋은 점"],
      improvements: ["개선 점"],
      representativeComments: { positive: [], neutral: [], negative: [] },
    },
    commentsMeta: { analyzed: 10, total: 100 },
  };
}

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getApiKeys", () => {
    it("키가 없으면 빈 문자열을 반환한다", () => {
      const keys = getApiKeys();
      expect(keys.youtube).toBe("");
      expect(keys.gemini).toBe("");
    });

    it("저장된 키를 반환한다", () => {
      localStorage.setItem("yt-sentiment-youtube-key", "yt-key-123");
      localStorage.setItem("yt-sentiment-gemini-key", "gemini-456");
      const keys = getApiKeys();
      expect(keys.youtube).toBe("yt-key-123");
      expect(keys.gemini).toBe("gemini-456");
    });

    it("localStorage 접근 실패 시 빈 문자열을 반환한다", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Access denied");
      });
      const keys = getApiKeys();
      expect(keys.youtube).toBe("");
      expect(keys.gemini).toBe("");
      vi.restoreAllMocks();
    });
  });

  describe("saveApiKeys", () => {
    it("두 키를 localStorage에 저장한다", () => {
      saveApiKeys({ youtube: "yt-key", gemini: "gem-key" });
      expect(localStorage.getItem("yt-sentiment-youtube-key")).toBe("yt-key");
      expect(localStorage.getItem("yt-sentiment-gemini-key")).toBe("gem-key");
    });

    it("localStorage 접근 실패 시 에러를 무시한다", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceeded");
      });
      expect(() => saveApiKeys({ youtube: "a", gemini: "b" })).not.toThrow();
      vi.restoreAllMocks();
    });
  });

  describe("deleteApiKey", () => {
    it("youtube 키를 삭제한다", () => {
      localStorage.setItem("yt-sentiment-youtube-key", "yt-key");
      deleteApiKey("youtube");
      expect(localStorage.getItem("yt-sentiment-youtube-key")).toBeNull();
    });

    it("gemini 키를 삭제한다", () => {
      localStorage.setItem("yt-sentiment-gemini-key", "gem-key");
      deleteApiKey("gemini");
      expect(localStorage.getItem("yt-sentiment-gemini-key")).toBeNull();
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

  describe("getHistory", () => {
    it("기록이 없으면 빈 배열을 반환한다", () => {
      expect(getHistory()).toEqual([]);
    });

    it("저장된 기록을 반환한다", () => {
      const entries: HistoryEntry[] = [makeEntry("1"), makeEntry("2")];
      localStorage.setItem("yt-sentiment-history", JSON.stringify(entries));
      expect(getHistory()).toEqual(entries);
    });

    it("파싱 실패 시 빈 배열을 반환한다", () => {
      localStorage.setItem("yt-sentiment-history", "invalid-json");
      expect(getHistory()).toEqual([]);
    });

    it("localStorage 접근 실패 시 빈 배열을 반환한다", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Access denied");
      });
      expect(getHistory()).toEqual([]);
      vi.restoreAllMocks();
    });
  });

  describe("addHistoryEntry", () => {
    it("항목을 맨 앞에 추가한다", () => {
      const e1 = makeEntry("1");
      const e2 = makeEntry("2");
      addHistoryEntry(e1);
      addHistoryEntry(e2);
      const history = getHistory();
      expect(history[0].id).toBe("2");
      expect(history[1].id).toBe("1");
    });

    it("최대 50개까지만 유지한다", () => {
      for (let i = 0; i < 55; i++) {
        addHistoryEntry(makeEntry(String(i)));
      }
      expect(getHistory()).toHaveLength(50);
    });

    it("localStorage 접근 실패 시 에러를 무시한다", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceeded");
      });
      expect(() => addHistoryEntry(makeEntry("1"))).not.toThrow();
      vi.restoreAllMocks();
    });
  });

  describe("deleteHistoryEntry", () => {
    it("ID로 항목을 삭제한다", () => {
      addHistoryEntry(makeEntry("1"));
      addHistoryEntry(makeEntry("2"));
      deleteHistoryEntry("1");
      const history = getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe("2");
    });

    it("존재하지 않는 ID는 무시한다", () => {
      addHistoryEntry(makeEntry("1"));
      deleteHistoryEntry("nonexistent");
      expect(getHistory()).toHaveLength(1);
    });

    it("localStorage 접근 실패 시 에러를 무시한다", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Access denied");
      });
      expect(() => deleteHistoryEntry("1")).not.toThrow();
      vi.restoreAllMocks();
    });
  });

  describe("clearHistory", () => {
    it("모든 기록을 삭제한다", () => {
      addHistoryEntry(makeEntry("1"));
      addHistoryEntry(makeEntry("2"));
      clearHistory();
      expect(getHistory()).toEqual([]);
    });

    it("localStorage 접근 실패 시 에러를 무시한다", () => {
      vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
        throw new Error("Access denied");
      });
      expect(() => clearHistory()).not.toThrow();
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
      expect(keys.gemini).toBe("");
      globalThis.window = originalWindow;
    });

    it("window가 없는 환경에서 getHistory는 빈 배열을 반환한다", () => {
      const originalWindow = globalThis.window;
      // @ts-expect-error - SSR 환경 시뮬레이션
      delete globalThis.window;
      expect(getHistory()).toEqual([]);
      globalThis.window = originalWindow;
    });
  });
});
