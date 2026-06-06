import type { AnalysisReport, Comment } from "@/types";

/**
 * /api/analyze 호출 래퍼.
 * 에러 시 API Route가 반환한 에러 코드를 그대로 throw한다.
 */
export async function analyzeComments(
  comments: Comment[],
  apiKey: string
): Promise<AnalysisReport> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comments, apiKey }),
  });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error ?? "Unknown error");
  }

  return res.json();
}
