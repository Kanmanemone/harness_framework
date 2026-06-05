# 아키텍처

## 디렉토리 구조
```
src/
├── app/
│   ├── layout.tsx                    # 루트 레이아웃 (메타데이터, 글로벌 스타일)
│   ├── page.tsx                      # 메인 페이지 (단일 페이지 앱, Client Component)
│   ├── globals.css                   # Tailwind 디렉티브
│   └── api/
│       ├── youtube/comments/
│       │   └── route.ts              # YouTube Data API v3 프록시
│       └── analyze/
│           └── route.ts              # Anthropic Claude API 프록시
├── components/
│   ├── ApiKeySettings.tsx            # API 키 입력 패널 (접을 수 있음)
│   ├── UrlInput.tsx                  # YouTube URL 입력 + 분석 버튼
│   ├── LoadingState.tsx              # 3단계 진행 표시기
│   ├── ErrorState.tsx                # 에러 메시지 카드 + 재시도 버튼
│   ├── EmptyState.tsx                # 첫 진입 시 안내 텍스트
│   ├── ReportView.tsx                # 리포트 전체 컨테이너
│   ├── ReportHeader.tsx              # 분석 댓글 수 표시
│   ├── SentimentChart.tsx            # 센티먼트 비율 바 (CSS only)
│   ├── InsightCard.tsx               # 강점/개선점 카드 (재사용)
│   └── CommentList.tsx               # 대표 댓글 목록
├── types/
│   └── index.ts                      # 모든 TypeScript 인터페이스
├── lib/
│   ├── youtube.ts                    # YouTube URL 파싱, videoId 추출
│   ├── storage.ts                    # localStorage 헬퍼 (API 키 저장/조회/삭제)
│   └── constants.ts                  # Claude 프롬프트 템플릿, 설정 상수, 에러 메시지 맵
└── services/
    ├── youtubeService.ts             # /api/youtube/comments 호출 래퍼
    └── analyzeService.ts             # /api/analyze 호출 래퍼
```

## 패턴
- `page.tsx`만 Client Component (`"use client"`). 하위 컴포넌트도 page.tsx에서 렌더되므로 자동으로 Client Component로 동작한다.
- API 라우트는 외부 API(YouTube, Anthropic)에 대한 서버사이드 프록시 역할. 클라이언트에서 직접 외부 API를 호출하지 않는다.
- Anthropic SDK를 사용하지 않고 `fetch`로 직접 Messages API를 호출한다.
- 외부 UI/차트 라이브러리 없이 Tailwind CSS만으로 UI를 구성한다.

---

## 타입 정의 (`types/index.ts`)

### YouTube 관련
```typescript
interface Comment {
  id: string;              // YouTube 댓글 고유 ID
  text: string;            // 댓글 본문 (plainText)
  author: string;          // 작성자 이름
  likeCount: number;       // 좋아요 수
  publishedAt: string;     // 작성 시각 (ISO 8601)
}

interface YouTubeCommentsResponse {
  comments: Comment[];
  totalResults: number;    // YouTube가 보고하는 전체 댓글 수
  videoId: string;
}
```

### 분석 결과
```typescript
interface SentimentRatio {
  positive: number;        // 0-100 (퍼센트)
  neutral: number;         // 0-100
  negative: number;        // 0-100, 세 값의 합은 반드시 100
}

interface RepresentativeComment {
  text: string;            // 원문 그대로
  author: string;          // 작성자 이름
}

interface AnalysisReport {
  summary: string;                        // 전체 요약 (1-2문장)
  sentiment: SentimentRatio;
  strengths: string[];                    // 최대 5개
  improvements: string[];                 // 최대 5개
  representativeComments: {
    positive: RepresentativeComment[];    // 2-3개
    neutral: RepresentativeComment[];     // 2-3개
    negative: RepresentativeComment[];    // 2-3개
  };
}
```

### 앱 상태
```typescript
type AppPhase = "idle" | "loading" | "report" | "error";

interface LoadingStep {
  label: string;
  status: "pending" | "active" | "done";
}

interface ApiKeys {
  youtube: string;
  anthropic: string;
}

interface ApiError {
  error: string;
  isApiKeyError?: boolean;  // true면 설정 패널 자동 열기
}
```

---

## API 명세

### GET /api/youtube/comments

YouTube Data API v3의 `commentThreads.list`를 프록시한다.

**Request:**
| 파라미터 | 위치 | 필수 | 설명 |
|----------|------|------|------|
| videoId | query | O | YouTube 영상 ID (11자) |
| apiKey | query | O | YouTube Data API v3 키 |
| maxResults | query | X | 수집할 댓글 수 (기본값: 100, 최대: 100) |

**Response (200):**
```json
{
  "comments": [
    {
      "id": "UgxB3...",
      "text": "좋은 영상 감사합니다",
      "author": "홍길동",
      "likeCount": 42,
      "publishedAt": "2024-01-15T09:30:00Z"
    }
  ],
  "totalResults": 1523,
  "videoId": "dQw4w9WgXcQ"
}
```

**Error Responses:**
| 상태 | 조건 | 응답 body |
|------|------|-----------|
| 400 | videoId 또는 apiKey 누락 | `{ "error": "Missing videoId or apiKey" }` |
| 400 | YouTube API가 잘못된 키로 거부 | `{ "error": "YouTube API error: ...", "isApiKeyError": true }` |
| 403 | 댓글 비활성화 | `{ "error": "commentsDisabled" }` |
| 403 | 할당량 초과 | `{ "error": "quotaExceeded" }` |
| 404 | 영상 없음 | `{ "error": "videoNotFound" }` |
| 504 | YouTube API 응답 타임아웃 | `{ "error": "YouTube API timeout" }` |

**구현 세부사항:**
- YouTube API 호출 URL: `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId={videoId}&maxResults={maxResults}&order=relevance&textFormat=plainText&key={apiKey}`
- YouTube API 응답에서 `items[].snippet.topLevelComment.snippet`의 `textDisplay`, `authorDisplayName`, `likeCount`, `publishedAt`를 추출하여 `Comment` 형태로 변환한다
- YouTube API 에러 응답의 `error.errors[0].reason`을 확인하여 `commentsDisabled`, `quotaExceeded`, `videoNotFound` 등을 구분한다
- fetch에 `signal: AbortSignal.timeout(15000)` 적용 — 15초 타임아웃. 초과 시 504 반환.

### POST /api/analyze

Anthropic Messages API를 프록시하여 댓글 센티먼트를 분석한다.

**Request:**
```json
{
  "comments": [Comment, ...],  // Comment[] (최소 1개)
  "apiKey": "sk-ant-..."       // Anthropic API 키
}
```

**Request body 크기 제한:** 100개 댓글 × 평균 200자 = ~20KB. Next.js 기본 body 파서 한도(1MB)에 한참 못 미침.

**Response (200):**
```json
{
  "summary": "전반적으로 긍정적인 반응이 많으며...",
  "sentiment": { "positive": 65, "neutral": 25, "negative": 10 },
  "strengths": ["설명이 명확하다", "편집이 깔끔하다"],
  "improvements": ["음질 개선 필요", "자막 추가 요청"],
  "representativeComments": {
    "positive": [{ "text": "...", "author": "..." }],
    "neutral": [{ "text": "...", "author": "..." }],
    "negative": [{ "text": "...", "author": "..." }]
  }
}
```

**Error Responses:**
| 상태 | 조건 | 응답 body |
|------|------|-----------|
| 400 | comments 또는 apiKey 누락 | `{ "error": "Missing comments or apiKey" }` |
| 400 | comments가 빈 배열 | `{ "error": "No comments to analyze" }` |
| 401 | Anthropic API 키 무효 | `{ "error": "Invalid Anthropic API key", "isApiKeyError": true }` |
| 400 | Anthropic 잔액 부족 | `{ "error": "Insufficient Anthropic API credits" }` |
| 429 | Anthropic 레이트 리밋 | `{ "error": "Rate limited. Please try again later." }` |
| 500 | Claude JSON 파싱 실패 | `{ "error": "Failed to parse analysis result" }` |
| 502 | Anthropic 서버 오류 | `{ "error": "AI service temporarily unavailable" }` |
| 504 | Anthropic API 응답 타임아웃 | `{ "error": "AI service timeout" }` |

**구현 세부사항:**
- Anthropic API 호출: `POST https://api.anthropic.com/v1/messages`
- 헤더: `Content-Type: application/json`, `x-api-key: {apiKey}`, `anthropic-version: 2023-06-01`
- 모델: `claude-sonnet-4-20250514`
- `max_tokens: 2048`
- fetch에 `signal: AbortSignal.timeout(30000)` 적용 — 30초 타임아웃 (Claude 응답이 YouTube API보다 느림). 초과 시 504 반환.
- Claude의 텍스트 응답을 `JSON.parse`하여 `AnalysisReport` 객체로 변환
- JSON 파싱 전 방어 처리:
  1. 응답 텍스트에서 ` ```json ``` ` 코드 펜스 제거
  2. 첫 `{`부터 마지막 `}`까지 추출
  3. `JSON.parse` 시도
  4. 실패 시 500 에러 반환

---

## Claude 프롬프트 설계 (`lib/constants.ts`)

```
You are analyzing YouTube video comments to produce a sentiment report.

Here are {count} comments from the video:

[1] (Likes: 42) 좋은 영상 감사합니다
[2] (Likes: 15) 음질이 좀 아쉽네요
...

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
    "positive": [{ "text": "exact comment", "author": "name" }],
    "neutral": [...],
    "negative": [...]
  }
}

Rules:
- sentiment percentages must sum to 100
- Pick 2-3 representative comments per category (only from provided comments)
- strengths and improvements should be concrete, not generic
- If comments are in a non-English language, write the analysis in that same language
- Return ONLY the JSON object, nothing else
```

**프롬프트 설계 의도:**
- 좋아요 수(`Likes: N`)를 포함하여 Claude가 인기 댓글에 더 높은 가중치를 부여하도록 유도
- "no markdown, no code fences"를 명시하여 ` ```json ` 래핑 방지
- "ONLY from provided comments"를 명시하여 Claude가 댓글을 지어내는 것을 방지
- "Return ONLY the JSON"을 명시하여 부가 설명 없는 순수 JSON 출력 유도
- 언어 자동 대응: "write the analysis in that same language"

---

## 데이터 흐름

### 정상 흐름
```
사용자: YouTube URL 입력 + "분석" 클릭 (또는 Enter)
    ↓
Client (page.tsx):
  1. url.trim() — 앞뒤 공백 제거
  2. extractVideoId(url) — videoId 추출. null이면 인라인 에러 표시, phase 유지(idle).
  3. getApiKeys() — localStorage에서 키 조회. 빈 값이면 인라인 에러 + 설정 패널 열기, phase 유지(idle).
  4. setPhase("loading"), loadingStep[0] = "active"
  5. URL 입력 필드 disabled, 분석 버튼 disabled
    ↓
Client → GET /api/youtube/comments?videoId=...&apiKey=...&maxResults=100
    ↓
API Route (youtube/comments/route.ts):
  1. videoId, apiKey 파라미터 검증
  2. YouTube Data API v3 호출 (commentThreads.list, 15초 타임아웃)
  3. 응답 변환: items[] → Comment[]
  4. 에러 시: YouTube 에러 reason 파싱 → 적절한 HTTP 상태 + 에러 메시지 반환
    ↓
Client:
  1. 응답 수신. 에러면 setPhase("error") + 에러 메시지 표시.
     에러에 isApiKeyError가 있으면 설정 패널 자동 열기.
  2. comments.length === 0 이면 setPhase("error") + "댓글 없음" 메시지.
  3. loadingStep[0] = "done", loadingStep[1] = "active"
  4. totalResults를 상태에 저장 (리포트 헤더에서 사용)
    ↓
Client → POST /api/analyze { comments, apiKey }
    ↓
API Route (analyze/route.ts):
  1. comments, apiKey 검증
  2. buildAnalysisPrompt(comments) — 프롬프트 조립
  3. Anthropic Messages API 호출 (claude-sonnet-4-20250514, max_tokens: 2048, 30초 타임아웃)
  4. 응답에서 content[0].text 추출
  5. 방어 처리: 코드 펜스 제거 → JSON 추출 → JSON.parse
  6. 실패 시 500 에러 반환
  7. 파싱된 AnalysisReport 반환
    ↓
Client:
  1. 응답 수신. 에러면 setPhase("error") + 에러 메시지 표시.
  2. sentiment 합계 검증. 100이 아니면 정규화.
  3. setReport(result)
  4. loadingStep[1] = "done", loadingStep[2] = "active" → "done"
  5. setPhase("report")
  6. URL 입력 필드 다시 enabled (새 URL 입력 가능)
    ↓
ReportView 렌더링 (fade-in):
  ReportHeader (댓글 수) → summary → SentimentChart → InsightCard×2 → CommentList → "다른 영상 분석하기" 버튼
```

### 에러 흐름
```
어떤 단계에서든 에러 발생 시:
  1. catch 블록에서 에러 메시지 추출
  2. setError(message)
  3. setPhase("error")
  4. URL 입력 필드 다시 enabled, 기존 URL 유지
  5. 분석 버튼 다시 enabled
  6. ErrorState 컴포넌트 렌더링:
     - 에러 아이콘 (X 마크) + 에러 메시지 텍스트
     - "다시 시도" 버튼 (같은 URL로 재분석)
  7. isApiKeyError인 경우 설정 패널 자동 열기
  8. "다시 시도" 클릭 → handleAnalyze() 재실행 (phase는 다시 loading으로)
```

### 리포트 → 재분석 흐름
```
리포트 상태에서:
  옵션 A: "다른 영상 분석하기" 버튼 클릭
    → setUrl(""), setReport(null), setPhase("idle")
    → URL 입력 필드에 포커스 이동

  옵션 B: URL 입력 필드에 새 URL 입력 + "분석" 클릭
    → setReport(null), setPhase("loading")
    → 새 URL로 분석 시작

  옵션 C: URL 변경 없이 "분석" 버튼 클릭 (같은 영상 재분석)
    → setReport(null), setPhase("loading")
    → 동일 URL로 분석 시작
```

---

## 상태 관리

### 상태 변수
```typescript
const [phase, setPhase] = useState<AppPhase>("idle");
const [url, setUrl] = useState("");
const [report, setReport] = useState<AnalysisReport | null>(null);
const [error, setError] = useState<string | null>(null);
const [inlineError, setInlineError] = useState<string | null>(null);  // URL 검증 에러 (idle 상태에서)
const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);
const [settingsOpen, setSettingsOpen] = useState(false);
const [commentsMeta, setCommentsMeta] = useState<{ analyzed: number; total: number } | null>(null);
```

### 상태 전이 다이어그램
```
          ┌──────────────────────────────────┐
          │                                  │
          ▼                                  │
        idle ──(분석 클릭)──→ loading         │
          ▲                    │   │         │
          │                    │   │         │
          │              (성공)│   │(실패)    │
          │                    │   │         │
          │                    ▼   ▼         │
          │               report  error      │
          │                  │      │        │
          │     (다른 영상)──┘      │(다시 시도→loading)
          │        │                │(다른 영상)
          └────────┘────────────────┘
```

### 유효한 전이만 허용
| From | To | 트리거 | URL 필드 | 리포트 |
|------|----|--------|----------|--------|
| idle | loading | "분석" 클릭 (검증 통과) | disabled, 값 유지 | - |
| loading | report | 분석 완료 | enabled, 값 유지 | 표시 |
| loading | error | 어떤 단계든 실패 | enabled, 값 유지 | - |
| report | loading | 새 URL 입력 + "분석" 클릭 | disabled, 새 URL | 제거 |
| report | idle | "다른 영상 분석하기" 클릭 | enabled, 비움 + 포커스 | 제거 |
| error | loading | "다시 시도" 또는 "분석" 클릭 | disabled, 값 유지 | - |
| error | idle | "다른 영상 분석하기" 클릭 | enabled, 비움 + 포커스 | - |

`idle` 상태에서 검증 실패(잘못된 URL, 키 미설정)는 phase를 변경하지 않고 `inlineError`만 설정한다.

### 로딩 단계
| 인덱스 | label | 언제 active | 언제 done |
|--------|-------|-------------|-----------|
| 0 | "댓글을 수집하고 있습니다..." | 분석 시작 | YouTube API 응답 수신 |
| 1 | "AI가 댓글을 분석하고 있습니다..." | 댓글 수집 완료 | Anthropic API 응답 수신 |
| 2 | "리포트를 생성하고 있습니다..." | 분석 완료 | 리포트 렌더링 직전 |

---

## 유틸리티 함수

### `lib/youtube.ts` — extractVideoId
```
입력: YouTube URL 문자열 (trim 처리된)
출력: 11자 영상 ID 또는 null

지원 패턴:
  /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/
  /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/
  /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
  /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/

주의사항:
  - URL에 &list=, &t=, &index= 등 추가 쿼리가 붙어도 동작해야 한다
  - YouTube video ID는 항상 정확히 11자이며 [a-zA-Z0-9_-]로 구성된다
  - http:// 와 https:// 모두 지원해야 한다
  - www 유무 모두 지원 (youtube.com, www.youtube.com)
  - 영상 ID만 입력한 경우 null 반환 (URL 패턴이 아니므로)
```

### `lib/storage.ts` — getApiKeys, saveApiKeys, deleteApiKey
```
localStorage 키:
  "yt-sentiment-youtube-key"   → YouTube API 키
  "yt-sentiment-anthropic-key" → Anthropic API 키

getApiKeys(): ApiKeys
  - SSR 환경(typeof window === "undefined")에서는 빈 문자열 반환
  - localStorage 접근을 try/catch로 감싼다 (시크릿 모드 대응)
  - 실패 시 빈 문자열 반환
  - localStorage에서 두 키를 읽어 ApiKeys 객체로 반환

saveApiKeys(keys: ApiKeys): void
  - 두 키를 localStorage에 저장
  - try/catch로 감싸고, 실패 시 에러를 무시 (메모리에서만 유지)

deleteApiKey(type: "youtube" | "anthropic"): void
  - 해당 키를 localStorage에서 제거

isStorageAvailable(): boolean
  - localStorage 접근 가능 여부 반환 (시크릿 모드 감지용)
```

### `lib/constants.ts` — 에러 메시지 매핑
```typescript
// API Route가 반환한 에러 코드 → 사용자 친화적 한국어 메시지
const ERROR_MESSAGES: Record<string, string> = { ... };

// API 키 관련 에러인지 판별 (설정 패널 자동 열기용)
const API_KEY_ERRORS = new Set([
  "YouTube API 키가 유효하지 않습니다",
  "Invalid Anthropic API key",
  ...
]);
```

---

## 컴포넌트 Props

```typescript
// ApiKeySettings
{
  open: boolean;
  onToggle: () => void;
  onSave: (keys: ApiKeys) => void;
  onDelete: (type: "youtube" | "anthropic") => void;
  savedKeys: ApiKeys;          // 마스킹 표시용 (빈 문자열이면 미설정)
  storageAvailable: boolean;   // false면 "시크릿 모드" 안내 표시
}

// UrlInput
{
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  error: string | null;        // 인라인 에러 메시지
}

// LoadingState
{ steps: LoadingStep[] }

// ErrorState
{
  message: string;
  onRetry: () => void;         // "다시 시도"
  onReset: () => void;         // "다른 영상 분석하기"
}

// EmptyState
(props 없음 — 정적 안내 텍스트)

// ReportView
{
  report: AnalysisReport;
  commentsMeta: { analyzed: number; total: number };
  onReset: () => void;         // "다른 영상 분석하기"
}

// ReportHeader
{ analyzed: number; total: number }

// SentimentChart
{ sentiment: SentimentRatio }

// InsightCard
{ title: string; items: string[]; variant: "positive" | "negative" }

// CommentList
{ comments: AnalysisReport["representativeComments"] }
```

---

## 에러 처리 전략

### 레이어별 에러 처리

**1. 클라이언트 검증 (page.tsx, API 호출 전) — phase를 바꾸지 않음**
| 조건 | 처리 |
|------|------|
| URL 입력이 비어 있음 | "분석" 버튼 비활성화 (disabled). 에러 메시지 없음. |
| extractVideoId가 null 반환 | inlineError = "유효한 YouTube URL을 입력해 주세요. (예: https://www.youtube.com/watch?v=...)" |
| API 키가 비어 있음 | inlineError = "API 키를 먼저 설정해 주세요." + 설정 패널 자동 열기 |
| 사용자가 URL 수정 시 | inlineError = null (에러 자동 제거) |

**2. API Route — YouTube 프록시 (youtube/comments/route.ts)**
| YouTube API 응답 | 우리 API 응답 |
|------------------|---------------|
| 200 + items 있음 | 200 + Comment[] 반환 |
| 200 + items 없음 | 200 + 빈 배열 반환 (클라이언트에서 처리) |
| 400 (badRequest) | 400 + `{ error: "...", isApiKeyError: true }` |
| 403 reason=commentsDisabled | 403 + `{ error: "commentsDisabled" }` |
| 403 reason=quotaExceeded | 403 + `{ error: "quotaExceeded" }` |
| 404 reason=videoNotFound | 404 + `{ error: "videoNotFound" }` |
| 기타 에러 | 해당 상태코드 + `{ error: YouTube 에러 메시지 }` |
| fetch 타임아웃 (15초) | 504 + `{ error: "YouTube API timeout" }` |
| fetch 자체 실패 (네트워크) | 502 + `{ error: "Failed to reach YouTube API" }` |

**3. API Route — Claude 프록시 (analyze/route.ts)**
| Anthropic API 응답 | 우리 API 응답 |
|--------------------|---------------|
| 200 + 유효한 JSON 텍스트 | 200 + AnalysisReport |
| 200 + JSON 파싱 실패 (방어 처리 후에도) | 500 + `{ error: "Failed to parse analysis result" }` |
| 401 (authentication_error) | 401 + `{ error: "Invalid Anthropic API key", isApiKeyError: true }` |
| 400 (insufficient_quota) | 400 + `{ error: "Insufficient Anthropic API credits" }` |
| 429 (rate_limit_error) | 429 + `{ error: "Rate limited" }` |
| 500/529 (서버 오류/과부하) | 502 + `{ error: "AI service temporarily unavailable" }` |
| fetch 타임아웃 (30초) | 504 + `{ error: "AI service timeout" }` |
| fetch 자체 실패 (네트워크) | 502 + `{ error: "Failed to reach AI service" }` |

**4. 클라이언트 에러 수신 (page.tsx, API 호출 후)**
```typescript
try {
  const { comments, totalResults } = await fetchComments(videoId, keys.youtube);

  if (comments.length === 0) {
    setError("이 영상에 댓글이 없습니다.");
    setPhase("error");
    return;
  }

  setCommentsMeta({ analyzed: comments.length, total: totalResults });
  // ... loadingStep 업데이트 ...

  const result = await analyzeComments(comments, keys.anthropic);
  // ... sentiment 정규화, 리포트 표시 ...

} catch (err) {
  const message = err instanceof Error ? err.message : "예기치 않은 오류가 발생했습니다";
  setError(mapErrorMessage(message));  // 에러 코드 → 한국어 메시지
  setPhase("error");

  if (isApiKeyError(message)) {
    setSettingsOpen(true);  // 설정 패널 자동 열기
  }
}
```

서비스 레이어(`services/*.ts`)에서 `res.ok`가 아닌 경우 에러 body의 `error` 필드를 추출하여 `throw new Error(에러코드)`한다. `lib/constants.ts`의 `mapErrorMessage()`가 에러 코드를 사용자 친화적 한국어 메시지로 변환한다.

### 에러 메시지 매핑 (lib/constants.ts)

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  "commentsDisabled": "이 영상은 댓글이 비활성화되어 있습니다.",
  "quotaExceeded": "YouTube API 일일 할당량을 초과했습니다. 내일 다시 시도해 주세요.",
  "videoNotFound": "영상을 찾을 수 없습니다. URL을 확인해 주세요.",
  "Invalid Anthropic API key": "Anthropic API 키가 유효하지 않습니다. 키를 확인해 주세요.",
  "Insufficient Anthropic API credits": "Anthropic API 잔액이 부족합니다. 크레딧을 확인해 주세요.",
  "Rate limited": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  "AI service temporarily unavailable": "AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.",
  "AI service timeout": "AI 응답이 너무 오래 걸립니다. 다시 시도해 주세요.",
  "YouTube API timeout": "YouTube 응답이 너무 오래 걸립니다. 다시 시도해 주세요.",
  "Failed to parse analysis result": "분석 결과를 처리하지 못했습니다. 다시 시도해 주세요.",
  "Failed to reach YouTube API": "YouTube 서비스에 연결할 수 없습니다. 네트워크를 확인해 주세요.",
  "Failed to reach AI service": "AI 서비스에 연결할 수 없습니다. 네트워크를 확인해 주세요.",
};

function mapErrorMessage(errorCode: string): string {
  return ERROR_MESSAGES[errorCode] ?? "예기치 않은 오류가 발생했습니다. 다시 시도해 주세요.";
}

const API_KEY_ERROR_CODES = new Set([
  "Invalid Anthropic API key",
  "YouTube API error",  // 400 badRequest는 대부분 키 문제
]);

function isApiKeyError(errorCode: string): boolean {
  return API_KEY_ERROR_CODES.has(errorCode);
}
```

---

## 엣지 케이스 처리

| 케이스 | 발생 시점 | 처리 방법 |
|--------|-----------|-----------|
| 댓글이 이모지로만 구성 | Claude 분석 | 프롬프트가 "concrete"를 요구하므로 Claude가 적절히 분류. 추가 처리 불필요. |
| 댓글에 HTML 엔티티 포함 | YouTube API | `textFormat=plainText`로 요청하므로 HTML 없음. |
| 댓글이 매우 긴 경우 (10,000자+) | Claude 분석 | 100개 댓글 총합이 Sonnet 입력 한도(200K 토큰) 이내이므로 문제없음. |
| 다국어 혼합 댓글 | Claude 분석 | Claude가 주 언어를 감지하여 해당 언어로 분석. |
| 동일 댓글 반복 (스팸) | Claude 분석 | Claude가 요약 시 자연스럽게 처리. 필터링 불필요. |
| Claude가 코드 펜스로 JSON 감싸기 | API Route | `JSON.parse` 전에 ` ```json ``` ` 패턴 제거하는 방어 코드 추가. |
| Claude가 JSON 외 텍스트 포함 | API Route | 응답 텍스트에서 첫 `{`부터 마지막 `}`까지 추출 시도. 실패 시 500 에러. |
| sentiment 합계가 100이 아님 | 클라이언트 | 정규화: 각 값을 합으로 나누고 100을 곱하여 반올림. |
| YouTube Shorts URL | 클라이언트 | `youtube.com/shorts/VIDEO_ID` 패턴을 extractVideoId에서 지원. |
| 사용자가 분석 중 URL 재입력 시도 | 클라이언트 | loading 상태에서 URL 입력 필드와 분석 버튼 모두 disabled. |
| localStorage 접근 불가 (시크릿 모드) | 클라이언트 | try/catch로 감싸고, 실패 시 메모리에만 유지. 설정 패널에 안내 표시. |
| URL 앞뒤 공백 | 클라이언트 | 분석 시작 시 trim() 처리. |
| http:// URL 입력 | 클라이언트 | extractVideoId가 http://도 지원. |
| www 없는 URL (youtube.com vs www.youtube.com) | 클라이언트 | 정규식이 www 유무 모두 매칭. |
| API Route 타임아웃 | API Route | YouTube 15초, Claude 30초 타임아웃. AbortSignal.timeout() 사용. |
| 분석 중 탭 전환/백그라운드 | 클라이언트 | 별도 처리 없음. fetch는 백그라운드에서 계속 진행. 탭으로 돌아오면 결과 표시. |
