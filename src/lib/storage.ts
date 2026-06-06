import type { ApiKeys } from "@/types";

const YOUTUBE_KEY = "yt-sentiment-youtube-key";
const ANTHROPIC_KEY = "yt-sentiment-anthropic-key";

/**
 * localStorage에서 API 키를 읽어 반환한다.
 * SSR 환경이나 접근 불가 시 빈 문자열을 반환한다.
 */
export function getApiKeys(): ApiKeys {
  if (typeof window === "undefined") {
    return { youtube: "", anthropic: "" };
  }

  try {
    return {
      youtube: localStorage.getItem(YOUTUBE_KEY) ?? "",
      anthropic: localStorage.getItem(ANTHROPIC_KEY) ?? "",
    };
  } catch {
    return { youtube: "", anthropic: "" };
  }
}

/**
 * API 키를 localStorage에 저장한다.
 * 실패 시 에러를 무시한다.
 */
export function saveApiKeys(keys: ApiKeys): void {
  try {
    localStorage.setItem(YOUTUBE_KEY, keys.youtube);
    localStorage.setItem(ANTHROPIC_KEY, keys.anthropic);
  } catch {
    // 시크릿 모드 등에서 실패 시 무시
  }
}

/**
 * 지정된 API 키를 localStorage에서 삭제한다.
 */
export function deleteApiKey(type: "youtube" | "anthropic"): void {
  const key = type === "youtube" ? YOUTUBE_KEY : ANTHROPIC_KEY;
  try {
    localStorage.removeItem(key);
  } catch {
    // 실패 시 무시
  }
}

/**
 * localStorage 접근 가능 여부를 반환한다.
 */
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
