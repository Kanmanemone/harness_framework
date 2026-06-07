import type { Comment } from "@/types";

export const GEMINI_MODEL = "gemini-2.5-flash";
export const GEMINI_MAX_TOKENS = 8192;
export const YOUTUBE_TIMEOUT_MS = 15000;
export const GEMINI_TIMEOUT_MS = 60000;

/**
 * 댓글 목록을 Gemini 분석용 프롬프트로 조립한다.
 */
export function buildAnalysisPrompt(comments: Comment[]): string {
  const commentLines = comments
    .map((c, i) => `[${i + 1}] (${c.author}, Likes: ${c.likeCount}) ${c.text}`)
    .join("\n");

  return `You are analyzing YouTube video comments to produce a sentiment report.

Here are ${comments.length} comments from the video:

${commentLines}

Analyze these comments and return a JSON object with EXACTLY this structure
(no markdown, no code fences, just raw JSON):

{
  "summary": "1-2 sentence overall summary",
  "sentiment": {
    "positive": <number 0-100>,
    "neutral": <number 0-100>,
    "negative": <number 0-100>
  },
  "strengths": ["max 5 items"],
  "improvements": ["max 5 items"],
  "representativeComments": {
    "positive": [{ "text": "exact comment text", "author": "exact author name from data" }],
    "neutral": [...],
    "negative": [...]
  }
}

Rules:
- sentiment percentages must sum to 100
- Pick 2-3 representative comments per category (only from provided comments)
- strengths and improvements should be concrete, not generic
- If comments are in a non-English language, write the analysis in that same language
- Return ONLY the JSON object, nothing else`;
}

const ERROR_MESSAGES: Record<string, string> = {
  commentsDisabled: "이 영상은 댓글이 비활성화되어 있습니다.",
  quotaExceeded: "YouTube API 일일 할당량을 초과했습니다. 내일 다시 시도해 주세요.",
  videoNotFound: "영상을 찾을 수 없습니다. URL을 확인해 주세요.",
  "Invalid Gemini API key": "Gemini API 키가 유효하지 않습니다. 키를 확인해 주세요.",
  "Gemini API quota exceeded": "Gemini API 할당량을 초과했습니다. 잠시 후 다시 시도해 주세요.",
  "Gemini credits depleted": "Gemini 선불 크레딧이 소진되었습니다. AI Studio에서 무료 티어 프로젝트로 새 키를 발급받으세요.",
  "Rate limited": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  "AI service temporarily unavailable": "AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.",
  "AI service timeout": "AI 응답이 너무 오래 걸립니다. 다시 시도해 주세요.",
  "YouTube API timeout": "YouTube 응답이 너무 오래 걸립니다. 다시 시도해 주세요.",
  "Failed to parse analysis result": "분석 결과를 처리하지 못했습니다. 다시 시도해 주세요.",
  "Failed to reach YouTube API": "YouTube 서비스에 연결할 수 없습니다. 네트워크를 확인해 주세요.",
  "Failed to reach AI service": "AI 서비스에 연결할 수 없습니다. 네트워크를 확인해 주세요.",
};

/**
 * API 에러 코드를 사용자 친화적 한국어 메시지로 변환한다.
 */
export function mapErrorMessage(errorCode: string): string {
  return ERROR_MESSAGES[errorCode] ?? "예기치 않은 오류가 발생했습니다. 다시 시도해 주세요.";
}

const API_KEY_ERROR_CODES = new Set([
  "Invalid Gemini API key",
  "YouTube API error",
]);

/**
 * API 키 관련 에러인지 판별한다 (설정 패널 자동 열기용).
 */
export function isApiKeyError(errorCode: string): boolean {
  return API_KEY_ERROR_CODES.has(errorCode);
}
