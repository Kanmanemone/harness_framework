# Step 4: api-analyze

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md` — "API 명세 > POST /api/analyze" 섹션 전체, "에러 처리 전략 > API Route — Claude 프록시" 섹션, "Claude 프롬프트 설계" 섹션
- `/docs/ADR.md` — ADR-002(Claude Sonnet), ADR-007(JSON 프롬프트)
- `/src/types/index.ts` (Step 1에서 생성됨)
- `/src/lib/constants.ts` (Step 2에서 생성됨 — buildAnalysisPrompt, CLAUDE_MODEL, CLAUDE_MAX_TOKENS, ANTHROPIC_TIMEOUT_MS)

이전 step에서 만들어진 코드를 꼼꼼히 읽고, 프롬프트 빌더와 상수를 이해한 뒤 작업하라.

## 작업

### 1. `src/app/api/analyze/route.ts` 생성

Next.js App Router의 Route Handler로 구현한다.

```typescript
export async function POST(request: Request): Promise<Response>
```

ARCHITECTURE.md "API 명세 > POST /api/analyze" 섹션을 정확히 구현한다.

**요청 처리:**
- request body에서 `comments`(Comment[])와 `apiKey`(string)를 추출한다.
- `comments`가 없거나 빈 배열이면 400 에러를 반환한다.
- `apiKey`가 없으면 400 에러를 반환한다.

**Anthropic API 호출:**
- URL: `https://api.anthropic.com/v1/messages`
- Method: POST
- 헤더: `Content-Type: application/json`, `x-api-key: {apiKey}`, `anthropic-version: 2023-06-01`
- Body: `{ model: CLAUDE_MODEL, max_tokens: CLAUDE_MAX_TOKENS, messages: [{ role: "user", content: prompt }] }`
- `signal: AbortSignal.timeout(ANTHROPIC_TIMEOUT_MS)`로 30초 타임아웃을 적용한다.
- 프롬프트는 `buildAnalysisPrompt(comments)`로 생성한다 (lib/constants.ts에서 import).

**응답 처리:**
- 성공 시 `data.content[0].text`에서 텍스트를 추출한다.
- JSON 파싱 전 방어 처리 (ADR-007 방어 코드):
  1. 응답 텍스트에서 ` ```json ``` ` 코드 펜스를 제거한다.
  2. 첫 `{`부터 마지막 `}`까지 추출한다.
  3. `JSON.parse`를 시도한다.
  4. 파싱 실패 시 500 에러를 반환한다.
- 파싱된 JSON을 `AnalysisReport`로 반환한다.

**에러 처리 — ARCHITECTURE.md "에러 처리 전략" 테이블을 따른다:**
- 401 (authentication_error) → 401 + `{ error: "Invalid Anthropic API key", isApiKeyError: true }`
- 400 (insufficient_quota 등) → 400 + `{ error: "Insufficient Anthropic API credits" }`
- 429 (rate_limit_error) → 429 + `{ error: "Rate limited" }`
- 500/529 (서버 오류/과부하) → 502 + `{ error: "AI service temporarily unavailable" }`
- fetch 타임아웃 → 504 + `{ error: "AI service timeout" }`
- fetch 네트워크 실패 → 502 + `{ error: "Failed to reach AI service" }`
- JSON 파싱 실패 → 500 + `{ error: "Failed to parse analysis result" }`

핵심 규칙:
- `isApiKeyError: true`를 401 에러에만 포함한다.
- Anthropic API 에러 응답의 `error.type` 필드로 에러 종류를 구분한다.
- JSON 파싱 방어 코드에서 코드 펜스 제거와 JSON 추출을 별도 함수(`extractJson`)로 분리하면 테스트하기 쉽다.

### 2. `src/app/api/analyze/route.test.ts` 생성

Anthropic API를 mock하여 테스트한다. `global.fetch`를 vi.fn()으로 mock한다.

테스트 케이스:
- 정상 응답: 유효한 JSON → 200 + AnalysisReport
- 정상 응답: 코드 펜스로 감싼 JSON → 200 (방어 코드가 제거)
- 정상 응답: JSON 앞뒤에 텍스트 포함 → 200 (방어 코드가 추출)
- 파라미터 누락: comments 없음 → 400
- 파라미터 누락: apiKey 없음 → 400
- 빈 배열: comments가 [] → 400
- Anthropic 에러: 401 → 401 + isApiKeyError: true
- Anthropic 에러: 429 → 429
- Anthropic 에러: 500 → 502
- JSON 파싱 실패: 완전히 비정형 텍스트 → 500
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
   - Route 파일이 `src/app/api/analyze/route.ts`에 위치하는가?
   - `buildAnalysisPrompt`를 `lib/constants.ts`에서 import하여 사용하는가?
   - `CLAUDE_MODEL`, `CLAUDE_MAX_TOKENS`를 상수에서 import하는가?
   - JSON 파싱 전 코드 펜스 제거 + JSON 추출 방어 코드가 있는가? (ADR-007)
   - ARCHITECTURE.md의 에러 응답 테이블의 모든 케이스를 처리하는가?
   - API 키를 로깅하지 않는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 step 4를 업데이트한다.

## 금지사항

- Anthropic API를 실제로 호출하는 테스트를 작성하지 마라. 이유: API 키가 필요하고 비용이 발생한다. fetch를 mock하라.
- `@anthropic-ai/sdk`를 import하지 마라. 이유: ADR-004에 따라 fetch로 직접 호출.
- API 키를 `console.log`로 출력하지 마라. 이유: ADR-003 보안 고려사항.
- Claude의 응답을 검증(sentiment 합계 등)하지 마라. 이유: 검증은 클라이언트(Step 8)에서 처리.
- `services/` 디렉토리의 파일을 생성하지 마라. 이유: 서비스 레이어는 Step 5에서 작업.
