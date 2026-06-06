import type { YouTubeCommentsResponse } from "@/types";

/**
 * /api/youtube/comments 호출 래퍼.
 * 에러 시 API Route가 반환한 에러 코드를 그대로 throw한다.
 */
export async function fetchComments(
  videoId: string,
  apiKey: string
): Promise<YouTubeCommentsResponse> {
  const params = new URLSearchParams({
    videoId,
    apiKey,
    maxResults: "100",
  });

  const res = await fetch(`/api/youtube/comments?${params}`);

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error ?? "Unknown error");
  }

  return res.json();
}
