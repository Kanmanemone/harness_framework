# Step 3: api-youtube

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md` — "API 명세 > GET /api/youtube/comments" 섹션 전체, "에러 처리 전략 > API Route — YouTube 프록시" 섹션
- `/docs/ADR.md` — ADR-005(댓글 100개 제한), ADR-008(API 키 쿼리 파라미터)
- `/src/types/index.ts` (Step 1에서 생성됨)
- `/src/lib/constants.ts` (Step 2에서 생성됨 — YOUTUBE_TIMEOUT_MS 상수)

이전 step에서 만들어진 코드를 꼼꼼히 읽고, 타입 정의와 상수를 이해한 뒤 작업하라.

## 작업

### 1. `src/app/api/youtube/comments/route.ts` 생성

Next.js App Router의 Route Handler로 구현한다.

```typescript
export async function GET(request: Request): Promise<Response>
```

ARCHITECTURE.md "API 명세 > GET /api/youtube/comments" 섹션을 정확히 구현한다.

**요청 처리:**
- query parameter에서 `videoId`, `apiKey`, `maxResults`(기본값 100)를 추출한다.
- `videoId` 또는 `apiKey`가 없으면 400 에러를 반환한다.

**YouTube API 호출:**
- URL: `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId={videoId}&maxResults={maxResults}&order=relevance&textFormat=plainText&key={apiKey}`
- `signal: AbortSignal.timeout(YOUTUBE_TIMEOUT_MS)`로 15초 타임아웃을 적용한다.
- `YOUTUBE_TIMEOUT_MS`는 `lib/constants.ts`에서 import한다.

**응답 변환:**
- YouTube API 응답의 `items[].snippet.topLevelComment.snippet`에서 `textDisplay`, `authorDisplayName`, `likeCount`, `publishedAt`를 추출하여 `Comment` 형태로 변환한다.
- `pageInfo.totalResults`를 `totalResults`로 반환한다.

**에러 처리 — ARCHITECTURE.md "에러 처리 전략" 테이블을 따른다:**
- YouTube API 에러 응답의 `error.errors[0].reason`을 확인하여 에러를 구분한다.
- `commentsDisabled` → 403 + `{ error: "commentsDisabled" }`
- `quotaExceeded` → 403 + `{ error: "quotaExceeded" }`
- `videoNotFound` → 404 + `{ error: "videoNotFound" }`
- 400 (badRequest) → 400 + `{ error: "YouTube API error: ...", isApiKeyError: true }`
- fetch 타임아웃 → 504 + `{ error: "YouTube API timeout" }`
- fetch 네트워크 실패 → 502 + `{ error: "Failed to reach YouTube API" }`
- 기타 → 해당 상태코드 + YouTube 에러 메시지

핵심 규칙:
- `isApiKeyError: true`를 400 에러(badRequest)에만 포함한다. 403(할당량 초과, 댓글 비활성화)에는 포함하지 않는다.
- AbortError(타임아웃)와 TypeError(네트워크 실패)를 구분하여 504와 502로 각각 처리한다.

### 2. `src/app/api/youtube/comments/route.test.ts` 생성

YouTube API를 mock하여 테스트한다. `global.fetch`를 vi.fn()으로 mock한다.

테스트 케이스:
- 정상 응답: items 있음 → 200 + Comment[] 반환
- 정상 응답: items 없음 → 200 + 빈 배열
- 파라미터 누락: videoId 없음 → 400
- 파라미터 누락: apiKey 없음 → 400
- YouTube 에러: commentsDisabled → 403
- YouTube 에러: quotaExceeded → 403
- YouTube 에러: videoNotFound → 404
- YouTube 에러: badRequest → 400 + isApiKeyError: true
- 타임아웃 → 504
- 네트워크 실패 → 502

## Acceptance Criteria

```bash
npm run build   # 컴파일 에러 없음
npm test        # 모든 테스트 통과 (이전 step 테스트 포함)
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - Route 파일이 `src/app/api/youtube/comments/route.ts`에 위치하는가?
   - ARCHITECTURE.md의 에러 응답 테이블의 모든 케이스를 처리하는가?
   - `AbortSignal.timeout(YOUTUBE_TIMEOUT_MS)`가 적용되어 있는가?
   - `types/index.ts`의 `Comment`, `YouTubeCommentsResponse`를 사용하는가?
   - API 키를 로깅하지 않는가? (ADR-003 보안 고려사항)
3. 결과에 따라 `phases/0-mvp/index.json`의 step 3을 업데이트한다.

## 금지사항

- YouTube API를 실제로 호출하는 테스트를 작성하지 마라. 이유: API 키가 필요하고 할당량을 소비한다. fetch를 mock하라.
- API 키를 `console.log`로 출력하지 마라. 이유: ADR-003 보안 고려사항.
- 페이지네이션(nextPageToken)을 구현하지 마라. 이유: ADR-005에 따라 1회 호출로 최대 100개만 수집.
- `services/` 디렉토리의 파일을 생성하지 마라. 이유: 서비스 레이어는 Step 5에서 작업.
