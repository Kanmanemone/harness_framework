import {
  buildAnalysisPrompt,
  CLAUDE_MODEL,
  CLAUDE_MAX_TOKENS,
  ANTHROPIC_TIMEOUT_MS,
} from "@/lib/constants";
import type { Comment } from "@/types";

/**
 * 응답 텍스트에서 JSON 객체를 추출한다.
 * 1. 코드 펜스(```json ... ```) 제거
 * 2. 첫 `{`부터 마지막 `}`까지 추출
 */
function extractJson(text: string): string {
  // 코드 펜스 제거
  let cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```/g, "");

  // 첫 { 부터 마지막 } 까지 추출
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found");
  }

  cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  return cleaned;
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json() as {
    comments?: Comment[];
    apiKey?: string;
  };

  const { comments, apiKey } = body;

  if (!comments || !apiKey) {
    return Response.json(
      { error: "Missing comments or apiKey" },
      { status: 400 }
    );
  }

  if (comments.length === 0) {
    return Response.json(
      { error: "No comments to analyze" },
      { status: 400 }
    );
  }

  const prompt = buildAnalysisPrompt(comments);

  let res: globalThis.Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: CLAUDE_MAX_TOKENS,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(ANTHROPIC_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return Response.json(
        { error: "AI service timeout" },
        { status: 504 }
      );
    }
    return Response.json(
      { error: "Failed to reach AI service" },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const errorBody = await res.json() as {
      error?: { type?: string; message?: string };
    };
    const errorType = errorBody?.error?.type;

    if (res.status === 401 || errorType === "authentication_error") {
      return Response.json(
        { error: "Invalid Anthropic API key", isApiKeyError: true },
        { status: 401 }
      );
    }

    if (errorType === "insufficient_quota") {
      return Response.json(
        { error: "Insufficient Anthropic API credits" },
        { status: 400 }
      );
    }

    if (res.status === 429 || errorType === "rate_limit_error") {
      return Response.json(
        { error: "Rate limited. Please try again later." },
        { status: 429 }
      );
    }

    if (res.status >= 500) {
      return Response.json(
        { error: "AI service temporarily unavailable" },
        { status: 502 }
      );
    }

    return Response.json(
      { error: errorBody?.error?.message ?? "Unknown Anthropic API error" },
      { status: res.status }
    );
  }

  const data = await res.json() as {
    content: { type: string; text: string }[];
  };

  const rawText = data.content[0].text;

  try {
    const jsonString = extractJson(rawText);
    const report = JSON.parse(jsonString);
    return Response.json(report);
  } catch {
    return Response.json(
      { error: "Failed to parse analysis result" },
      { status: 500 }
    );
  }
}
