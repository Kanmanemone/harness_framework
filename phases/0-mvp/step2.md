# Step 2: lib-utils

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md` — "유틸리티 함수" 섹션, "Claude 프롬프트 설계" 섹션, "에러 메시지 매핑" 섹션
- `/docs/PRD.md` — "지원하는 URL 형식", "에러 메시지 매핑" 테이블
- `/docs/ADR.md` — ADR-007(JSON 프롬프트), ADR-011(입력 보존)
- `/src/types/index.ts` (Step 1에서 생성됨)

이전 step에서 만들어진 코드를 꼼꼼히 읽고, 타입 정의를 이해한 뒤 작업하라.

## 작업

### 1. `src/lib/youtube.ts` — YouTube URL 파서

```typescript
export function extractVideoId(url: string): string | null
```

ARCHITECTURE.md "유틸리티 함수" 섹션의 정규식 패턴 5개를 구현한다:

- `youtube.com/watch?v=VIDEO_ID`
- `youtu.be/VIDEO_ID`
- `youtube.com/embed/VIDEO_ID`
- `youtube.com/v/VIDEO_ID`
- `youtube.com/shorts/VIDEO_ID`

핵심 규칙:
- `http://`와 `https://` 모두 지원해야 한다.
- `www.` 유무 모두 매칭해야 한다.
- `&list=`, `&t=`, `&index=` 등 추가 쿼리 파라미터가 있어도 동작해야 한다.
- YouTube video ID는 정확히 11자이며 `[a-zA-Z0-9_-]`로 구성된다.
- URL이 아닌 입력(영상 ID만 입력 등)에는 `null`을 반환해야 한다.

### 2. `src/lib/storage.ts` — localStorage 헬퍼

```typescript
export function getApiKeys(): ApiKeys
export function saveApiKeys(keys: ApiKeys): void
export function deleteApiKey(type: "youtube" | "anthropic"): void
export function isStorageAvailable(): boolean
```

ARCHITECTURE.md "유틸리티 함수" 섹션의 명세를 따른다.

핵심 규칙:
- localStorage 키: `"yt-sentiment-youtube-key"`, `"yt-sentiment-anthropic-key"`
- SSR 환경(`typeof window === "undefined"`)에서 `getApiKeys()`는 빈 문자열을 반환해야 한다.
- 모든 localStorage 접근을 `try/catch`로 감싸라. 시크릿 모드에서 예외가 발생할 수 있다.
- `isStorageAvailable()`은 테스트 쓰기/읽기/삭제를 시도하여 성공 여부를 반환한다.

### 3. `src/lib/constants.ts` — 프롬프트 템플릿 + 에러 매핑

```typescript
export function buildAnalysisPrompt(comments: Comment[]): string
export function mapErrorMessage(errorCode: string): string
export function isApiKeyError(errorCode: string): boolean

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";
export const CLAUDE_MAX_TOKENS = 2048;
export const YOUTUBE_TIMEOUT_MS = 15000;
export const ANTHROPIC_TIMEOUT_MS = 30000;
```

핵심 규칙:
- `buildAnalysisPrompt`: ARCHITECTURE.md "Claude 프롬프트 설계" 섹션의 프롬프트를 정확히 구현한다. 댓글을 `[번호] (Likes: N) 텍스트` 형식으로 나열한다.
- `mapErrorMessage`: ARCHITECTURE.md "에러 메시지 매핑" 섹션의 `ERROR_MESSAGES` Record를 구현한다. 매핑에 없는 에러 코드는 "예기치 않은 오류가 발생했습니다. 다시 시도해 주세요."를 반환한다.
- `isApiKeyError`: ARCHITECTURE.md의 `API_KEY_ERROR_CODES` Set을 구현한다.

### 4. 단위 테스트

각 모듈에 대한 테스트 파일을 생성한다:

- `src/lib/youtube.test.ts` — 모든 URL 패턴 5개에 대한 성공 케이스, 추가 쿼리 파라미터, http/https, www 유무, 잘못된 입력(빈 문자열, 일반 URL, ID만 입력, 채널 URL) 실패 케이스.
- `src/lib/storage.test.ts` — getApiKeys, saveApiKeys, deleteApiKey, isStorageAvailable 테스트. window가 없는 환경(SSR) 시뮬레이션.
- `src/lib/constants.test.ts` — buildAnalysisPrompt의 출력 형식 검증, mapErrorMessage의 알려진/알 수 없는 에러 코드 매핑, isApiKeyError 판별.

## Acceptance Criteria

```bash
npm run build   # 컴파일 에러 없음
npm test        # 모든 테스트 통과
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `extractVideoId`가 5가지 URL 패턴 모두를 올바르게 파싱하는가?
   - `storage.ts`의 모든 함수가 try/catch로 localStorage 접근을 감싸고 있는가?
   - `buildAnalysisPrompt`의 출력이 ARCHITECTURE.md의 프롬프트 템플릿과 일치하는가?
   - `mapErrorMessage`가 ARCHITECTURE.md의 모든 에러 코드를 커버하는가?
   - `types/index.ts`의 타입을 올바르게 import하여 사용하는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 step 2를 업데이트한다.

## 금지사항

- `lib/` 외의 디렉토리에 파일을 생성하지 마라. 이유: 이 step의 scope는 lib 레이어만.
- `fetch`나 API 호출 코드를 넣지 마라. 이유: API 호출은 Step 3-4(api route), Step 5(service layer)에서 처리.
- localStorage 키 이름을 변경하지 마라. 이유: `"yt-sentiment-youtube-key"`, `"yt-sentiment-anthropic-key"`로 ARCHITECTURE.md에 명시됨.
- 프롬프트 템플릿의 구조를 임의로 변경하지 마라. 이유: ADR-007에 따라 JSON 직접 출력 방식을 사용하며, 프롬프트 문구가 분석 품질에 직접 영향.
