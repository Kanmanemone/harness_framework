# Step 5: service-layer

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md` — "에러 처리 전략 > 클라이언트 에러 수신" 섹션, "에러 메시지 매핑" 섹션
- `/src/types/index.ts` (Step 1에서 생성됨)
- `/src/lib/constants.ts` (Step 2에서 생성됨 — mapErrorMessage, isApiKeyError)
- `/src/app/api/youtube/comments/route.ts` (Step 3에서 생성됨 — API 응답 형식 확인용)
- `/src/app/api/analyze/route.ts` (Step 4에서 생성됨 — API 응답 형식 확인용)

이전 step에서 만들어진 코드를 꼼꼼히 읽고, API Route의 응답 형식과 에러 코드를 이해한 뒤 작업하라.

## 작업

### 1. `src/services/youtubeService.ts` 생성

```typescript
export async function fetchComments(videoId: string, apiKey: string): Promise<YouTubeCommentsResponse>
```

- `/api/youtube/comments`에 GET 요청을 보낸다.
- query parameter: `videoId`, `apiKey`, `maxResults=100`
- 응답이 `ok`가 아니면 에러 body에서 `error` 필드를 추출하여 `throw new Error(에러코드)`한다.
- 성공 시 `YouTubeCommentsResponse`를 반환한다.

### 2. `src/services/analyzeService.ts` 생성

```typescript
export async function analyzeComments(comments: Comment[], apiKey: string): Promise<AnalysisReport>
```

- `/api/analyze`에 POST 요청을 보낸다.
- body: `{ comments, apiKey }`
- 응답이 `ok`가 아니면 에러 body에서 `error` 필드를 추출하여 `throw new Error(에러코드)`한다.
- 성공 시 `AnalysisReport`를 반환한다.

핵심 규칙:
- 서비스 레이어는 에러 코드를 throw하기만 한다. 사용자 친화적 메시지 변환(`mapErrorMessage`)은 호출하지 않는다. 이유: 메시지 변환은 UI 레이어(page.tsx)의 책임이다.
- 서비스 레이어에서 `isApiKeyError` 판별도 하지 않는다. 이유: 설정 패널 열기는 UI 레이어의 책임이다.

### 3. 단위 테스트

- `src/services/youtubeService.test.ts`
- `src/services/analyzeService.test.ts`

`global.fetch`를 vi.fn()으로 mock하여 테스트한다.

각 서비스에 대해:
- 정상 응답 → 올바른 데이터 반환
- 에러 응답 (ok: false) → Error throw, 에러 메시지가 API의 error 필드 값과 일치
- fetch 자체 실패 → Error throw

## Acceptance Criteria

```bash
npm run build   # 컴파일 에러 없음
npm test        # 모든 테스트 통과 (이전 step 테스트 포함)
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `src/services/youtubeService.ts`와 `src/services/analyzeService.ts`가 존재하는가?
   - 서비스 함수가 `types/index.ts`의 타입을 올바르게 사용하는가?
   - 에러 발생 시 `throw new Error(에러코드)`로 에러를 전파하는가?
   - 서비스 레이어에서 `mapErrorMessage`나 `isApiKeyError`를 호출하지 않는가?
   - fetch URL이 `/api/youtube/comments`와 `/api/analyze`인가? (상대 경로)
3. 결과에 따라 `phases/0-mvp/index.json`의 step 5를 업데이트한다.

## 금지사항

- `mapErrorMessage`나 `isApiKeyError`를 서비스 레이어에서 호출하지 마라. 이유: 사용자 메시지 변환과 설정 패널 열기는 UI 레이어의 책임.
- 외부 API(YouTube, Anthropic)를 직접 호출하지 마라. 이유: 서비스 레이어는 내부 API Route만 호출한다. CLAUDE.md CRITICAL 규칙.
- 재시도 로직을 구현하지 마라. 이유: ADR-010에 따라 사용자가 수동으로 재시도한다.
- `components/` 디렉토리의 파일을 생성하지 마라. 이유: UI는 Step 6-7에서 작업.
