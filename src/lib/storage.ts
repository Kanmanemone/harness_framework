import type { ApiKeys, HistoryEntry } from "@/types";

const YOUTUBE_KEY = "yt-sentiment-youtube-key";
const GEMINI_KEY = "yt-sentiment-gemini-key";
const HISTORY_KEY = "yt-sentiment-history";
const MAX_HISTORY = 50;

/**
 * localStorage에서 API 키를 읽어 반환한다.
 * SSR 환경이나 접근 불가 시 빈 문자열을 반환한다.
 */
export function getApiKeys(): ApiKeys {
  if (typeof window === "undefined") {
    return { youtube: "", gemini: "" };
  }

  try {
    return {
      youtube: localStorage.getItem(YOUTUBE_KEY) ?? "",
      gemini: localStorage.getItem(GEMINI_KEY) ?? "",
    };
  } catch {
    return { youtube: "", gemini: "" };
  }
}

/**
 * API 키를 localStorage에 저장한다.
 * 실패 시 에러를 무시한다.
 */
export function saveApiKeys(keys: ApiKeys): void {
  try {
    localStorage.setItem(YOUTUBE_KEY, keys.youtube);
    localStorage.setItem(GEMINI_KEY, keys.gemini);
  } catch {
    // 시크릿 모드 등에서 실패 시 무시
  }
}

/**
 * 지정된 API 키를 localStorage에서 삭제한다.
 */
export function deleteApiKey(type: "youtube" | "gemini"): void {
  const key = type === "youtube" ? YOUTUBE_KEY : GEMINI_KEY;
  try {
    localStorage.removeItem(key);
  } catch {
    // 실패 시 무시
  }
}

/**
 * localStorage 접근 가능 여부를 반환한다.
 */
/**
 * localStorage에서 분석 기록을 읽어 반환한다 (최신순).
 */
export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

/**
 * 분석 기록을 맨 앞에 추가한다. 최대 MAX_HISTORY개 유지.
 */
export function addHistoryEntry(entry: HistoryEntry): void {
  try {
    const history = getHistory();
    history.unshift(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {
    // 실패 시 무시
  }
}

/**
 * ID로 분석 기록 하나를 삭제한다.
 */
export function deleteHistoryEntry(id: string): void {
  try {
    const history = getHistory();
    const filtered = history.filter((e) => e.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch {
    // 실패 시 무시
  }
}

/**
 * 모든 분석 기록을 삭제한다.
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // 실패 시 무시
  }
}

export function isStorageAvailable(): boolean {
  const testKey = "__storage_test__";
  try {
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
