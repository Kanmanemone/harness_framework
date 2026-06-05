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
│   ├── ReportView.tsx                # 리포트 전체 컨테이너
│   ├── SentimentChart.tsx            # 센티먼트 비율 바 (CSS only)
│   ├── InsightCard.tsx               # 강점/개선점 카드 (재사용)
│   └── CommentList.tsx               # 대표 댓글 목록
├── types/
│   └── index.ts                      # 모든 TypeScript 인터페이스
├── lib/
│   ├── youtube.ts                    # YouTube URL 파싱, videoId 추출
│   ├── storage.ts                    # localStorage 헬퍼 (API 키 저장/조회)
│   └── constants.ts                  # Claude 프롬프트 템플릿, 설정 상수
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
| 400 | YouTube API가 잘못된 키로 거부 | `{ "error": "YouTube API error: ..." }` |
| 403 | 댓글 비활성화 | `{ "error": "commentsDisabled" }` |
| 403 | 할당량 초과 | `{ "error": "quotaExceeded" }` |
| 404 | 영상 없음 | `{ "error": "videoNotFound" }` |

**구현 세부사항:**
- YouTube API 호출 URL: `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId={videoId}&maxResults={maxResults}&order=relevance&textFormat=plainText&key={apiKey}`
- YouTube API 응답에서 `items[].snippet.topLevelComment.snippet`의 `textDisplay`, `authorDisplayName`, `likeCount`, `publishedAt`를 추출하여 `Comment` 형태로 변환한다
- YouTube API 에러 응답의 `error.errors[0].reason`을 확인하여 `commentsDisabled`, `quotaExceeded`, `videoNotFound` 등을 구분한다

### POST /api/analyze

Anthropic Messages API를 프록시하여 댓글 센티먼트를 분석한다.

**Request:**
```json
{
  "comments": [Comment, ...],  // Comment[] (최소 1개)
  "apiKey": "sk-ant-..."       // Anthropic API 키
}
```

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
| 401 | Anthropic API 키 무효 | `{ "error": "Invalid Anthropic API key" }` |
| 400 | Anthropic 잔액 부족 | `{ "error": "Insufficient Anthropic API credits" }` |
| 429 | Anthropic 레이트 리밋 | `{ "error": "Rate limited. Please try again later." }` |
| 500 | Claude JSON 파싱 실패 | `{ "error": "Failed to parse analysis result" }` |
| 502 | Anthropic 서버 오류 | `{ "error": "AI service temporarily unavailable" }` |

**구현 세부사항:**
- Anthropic API 호출: `POST https://api.anthropic.com/v1/messages`
- 헤더: `Content-Type: application/json`, `x-api-key: {apiKey}`, `anthropic-version: 2023-06-01`
- 모델: `claude-sonnet-4-20250514`
- `max_tokens: 2048`
- Claude의 텍스트 응답을 `JSON.parse`하여 `AnalysisReport` 객체로 변환
- JSON 파싱 실패 시 500 에러를 반환 (재시도 로직은 클라이언트에서 사용자가 수동으로)

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
사용자: YouTube URL 입력 + "분석" 클릭
    ↓
Client (page.tsx):
  1. extractVideoId(url) — videoId 추출. null이면 에러 표시 후 중단.
  2. getApiKeys() — localStorage에서 키 조회. 빈 값이면 에러 표시 후 중단.
  3. setPhase("loading"), loadingStep[0] = "active"
    ↓
Client → GET /api/youtube/comments?videoId=...&apiKey=...&maxResults=100
    ↓
API Route (youtube/comments/route.ts):
  1. videoId, apiKey 파라미터 검증
  2. YouTube Data API v3 호출 (commentThreads.list)
  3. 응답 변환: items[] → Comment[]
  4. 에러 시: YouTube 에러 reason 파싱 → 적절한 HTTP 상태 + 에러 메시지 반환
    ↓
Client:
  1. 응답 수신. 에러면 setPhase("error") + 에러 메시지 표시.
  2. comments.length === 0 이면 "댓글 없음" 에러 표시 후 중단.
  3. loadingStep[0] = "done", loadingStep[1] = "active"
    ↓
Client → POST /api/analyze { comments, apiKey }
    ↓
API Route (analyze/route.ts):
  1. comments, apiKey 검증
  2. buildAnalysisPrompt(comments) — 프롬프트 조립
  3. Anthropic Messages API 호출 (claude-sonnet-4-20250514, max_tokens: 2048)
  4. 응답에서 content[0].text 추출
  5. JSON.parse — 실패 시 500 에러 반환
  6. 파싱된 AnalysisReport 반환
    ↓
Client:
  1. 응답 수신. 에러면 setPhase("error") + 에러 메시지 표시.
  2. setReport(result)
  3. loadingStep[1] = "done", loadingStep[2] = "active" → "done"
  4. setPhase("report")
    ↓
ReportView 렌더링: summary → SentimentChart → InsightCard×2 → CommentList
```

### 에러 흐름
```
어떤 단계에서든 에러 발생 시:
  1. catch 블록에서 에러 메시지 추출
  2. setError(message)
  3. setPhase("error")
  4. ErrorState 컴포넌트가 에러 메시지 + "다시 시도" 버튼 표시
  5. "다시 시도" 클릭 → setPhase("idle"), setError(null)
```

---

## 상태 관리

### 상태 변수
```typescript
const [phase, setPhase] = useState<AppPhase>("idle");
const [url, setUrl] = useState("");
const [report, setReport] = useState<AnalysisReport | null>(null);
const [error, setError] = useState<string | null>(null);
const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);
const [settingsOpen, setSettingsOpen] = useState(false);
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
          │     (다른 영상)──┘      │(다시 시도)
          └─────────────────────────┘
```

### 유효한 전이만 허용
| From | To | 트리거 |
|------|----|--------|
| idle | loading | "분석" 버튼 클릭 (검증 통과 시) |
| loading | report | 분석 완료 |
| loading | error | 어떤 단계든 실패 |
| report | idle | "다른 영상 분석하기" 클릭 |
| error | idle | "다시 시도" 클릭 |

`idle → error`는 없다. URL 검증 실패나 API 키 미설정은 `idle` 상태에서 인라인 메시지로 처리하고 phase를 변경하지 않는다.

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
입력: YouTube URL 문자열
출력: 11자 영상 ID 또는 null

지원 패턴:
  /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/
  /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/
  /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/

주의: URL에 &list=, &t=, &index= 등 추가 쿼리가 붙어도 동작해야 한다.
YouTube video ID는 항상 정확히 11자이며 [a-zA-Z0-9_-]로 구성된다.
```

### `lib/storage.ts` — getApiKeys, saveApiKeys
```
localStorage 키:
  "yt-sentiment-youtube-key"   → YouTube API 키
  "yt-sentiment-anthropic-key" → Anthropic API 키

getApiKeys(): ApiKeys
  - SSR 환경(typeof window === "undefined")에서는 빈 문자열 반환
  - localStorage에서 두 키를 읽어 ApiKeys 객체로 반환

saveApiKeys(keys: ApiKeys): void
  - 두 키를 localStorage에 저장
```

---

## 컴포넌트 Props

```typescript
// ApiKeySettings
{ open: boolean; onToggle: () => void; onSave: (keys: ApiKeys) => void }

// UrlInput
{ value: string; onChange: (v: string) => void; onSubmit: () => void; disabled: boolean }

// LoadingState
{ steps: LoadingStep[] }

// ReportView
{ report: AnalysisReport; onReset: () => void }

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

**1. 클라이언트 검증 (page.tsx, API 호출 전)**
| 조건 | 처리 |
|------|------|
| URL 입력이 비어 있음 | "분석" 버튼 비활성화 (disabled) |
| extractVideoId가 null 반환 | 인라인 에러 "유효한 YouTube URL을 입력해 주세요" |
| API 키가 비어 있음 | 인라인 에러 "API 키를 먼저 설정해 주세요" + 설정 패널 자동 열기 |

**2. API Route — YouTube 프록시 (youtube/comments/route.ts)**
| YouTube API 응답 | 우리 API 응답 |
|------------------|---------------|
| 200 + items 있음 | 200 + Comment[] 반환 |
| 200 + items 없음 | 200 + 빈 배열 반환 (클라이언트에서 처리) |
| 400 (badRequest) | 400 + `{ error: "YouTube API 키가 유효하지 않습니다" }` |
| 403 reason=commentsDisabled | 403 + `{ error: "commentsDisabled" }` |
| 403 reason=quotaExceeded | 403 + `{ error: "quotaExceeded" }` |
| 404 reason=videoNotFound | 404 + `{ error: "videoNotFound" }` |
| 기타 에러 | 해당 상태코드 + `{ error: YouTube 에러 메시지 }` |
| fetch 자체 실패 (네트워크) | 502 + `{ error: "Failed to reach YouTube API" }` |

**3. API Route — Claude 프록시 (analyze/route.ts)**
| Anthropic API 응답 | 우리 API 응답 |
|--------------------|---------------|
| 200 + 유효한 JSON 텍스트 | 200 + AnalysisReport |
| 200 + JSON 파싱 실패 | 500 + `{ error: "Failed to parse analysis result" }` |
| 401 (authentication_error) | 401 + `{ error: "Invalid Anthropic API key" }` |
| 400 (insufficient_quota) | 400 + `{ error: "Insufficient Anthropic API credits" }` |
| 429 (rate_limit_error) | 429 + `{ error: "Rate limited" }` |
| 500/529 (서버 오류/과부하) | 502 + `{ error: "AI service temporarily unavailable" }` |
| fetch 자체 실패 (네트워크) | 502 + `{ error: "Failed to reach AI service" }` |

**4. 클라이언트 에러 수신 (page.tsx, API 호출 후)**
```typescript
try {
  const { comments } = await fetchComments(videoId, keys.youtube);
  // ...
  const result = await analyzeComments(comments, keys.anthropic);
  // ...
} catch (err) {
  const message = err instanceof Error ? err.message : "예기치 않은 오류가 발생했습니다";
  setError(message);
  setPhase("error");
}
```

서비스 레이어(`services/*.ts`)에서 `res.ok`가 아닌 경우 에러 body의 `error` 필드를 추출하여 `throw new Error(에러메시지)`한다. 이 메시지가 클라이언트의 에러 메시지 매핑 테이블을 통해 사용자 친화적 메시지로 변환된다.

### 에러 메시지 매핑 (서비스 레이어)

서비스 레이어에서 API Route가 반환한 에러 코드를 사용자 메시지로 변환한다:

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  "commentsDisabled": "이 영상은 댓글이 비활성화되어 있습니다.",
  "quotaExceeded": "YouTube API 일일 할당량을 초과했습니다. 내일 다시 시도해 주세요.",
  "videoNotFound": "영상을 찾을 수 없습니다. URL을 확인해 주세요.",
  "Invalid Anthropic API key": "Anthropic API 키가 유효하지 않습니다. 키를 확인해 주세요.",
  "Insufficient Anthropic API credits": "Anthropic API 잔액이 부족합니다. 크레딧을 확인해 주세요.",
  "Rate limited": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  "AI service temporarily unavailable": "AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.",
  "Failed to parse analysis result": "분석 결과를 처리하지 못했습니다. 다시 시도해 주세요.",
  "Failed to reach YouTube API": "YouTube 서비스에 연결할 수 없습니다. 네트워크를 확인해 주세요.",
  "Failed to reach AI service": "AI 서비스에 연결할 수 없습니다. 네트워크를 확인해 주세요.",
};
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
| sentiment 합계가 100이 아님 | API Route | 클라이언트에서 정규화 (각 값을 합으로 나누어 100으로 맞춤). |
| YouTube Shorts URL | 클라이언트 | `youtube.com/shorts/VIDEO_ID` 패턴도 extractVideoId에서 지원. |
| 사용자가 분석 중 URL 재입력 | 클라이언트 | loading 상태에서 "분석" 버튼 비활성화하여 중복 요청 방지. |
| localStorage 접근 불가 (시크릿 모드 등) | 클라이언트 | try/catch로 감싸고, 실패 시 API 키를 세션 중에만 메모리에 유지. |
