import {
  buildAnalysisPrompt,
  GEMINI_MODEL,
  GEMINI_MAX_TOKENS,
  GEMINI_TIMEOUT_MS,
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

  const { comments, apiKey: bodyKey } = body;
  const apiKey = bodyKey || process.env.GEMINI_API_KEY;

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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  let res: globalThis.Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: GEMINI_MAX_TOKENS },
      }),
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
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
      error?: { code?: number; message?: string; status?: string };
    };
    const errorMessage = errorBody?.error?.message ?? "";

    console.error("[Gemini API Error]", {
      status: res.status,
      errorStatus: errorBody?.error?.status,
      message: errorMessage,
    });

    if (errorMessage.includes("API key not valid") || errorBody?.error?.status === "UNAUTHENTICATED") {
      return Response.json(
        { error: "Invalid Gemini API key", isApiKeyError: true },
        { status: 401 }
      );
    }

    if (res.status === 429 || errorBody?.error?.status === "RESOURCE_EXHAUSTED") {
      const msg = errorMessage.toLowerCase();
      let error = "Rate limited";
      if (msg.includes("quota exceeded")) error = "Gemini API quota exceeded";
      else if (msg.includes("credits are depleted") || msg.includes("prepayment")) error = "Gemini credits depleted";
      return Response.json(
        { error },
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
      { error: errorMessage || "Unknown Gemini API error" },
      { status: res.status }
    );
  }

  const data = await res.json() as {
    candidates: { content: { parts: { text: string }[] } }[];
  };

  const rawText = data.candidates[0].content.parts[0].text;

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
