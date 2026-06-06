# Step 8: main-page

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md` — "상태 관리" 섹션 전체, "데이터 흐름" 섹션 전체 (정상 흐름, 에러 흐름, 리포트→재분석 흐름)
- `/docs/PRD.md` — "사용자 경험 상세" 섹션 전체, "키보드 접근성"
- `/docs/UI_GUIDE.md` — "페이지 헤더", "레이아웃 > 페이지 구조", "애니메이션"
- `/docs/ADR.md` — ADR-010(취소 미제공), ADR-011(입력 보존), ADR-012(API 키 에러 시 설정 패널)
- `/src/types/index.ts` (Step 1)
- `/src/lib/youtube.ts` (Step 2 — extractVideoId)
- `/src/lib/storage.ts` (Step 2 — getApiKeys, saveApiKeys, deleteApiKey, isStorageAvailable)
- `/src/lib/constants.ts` (Step 2 — mapErrorMessage, isApiKeyError)
- `/src/services/youtubeService.ts` (Step 5 — fetchComments)
- `/src/services/analyzeService.ts` (Step 5 — analyzeComments)
- `/src/components/` (Step 6-7에서 생성된 모든 컴포넌트를 읽어라)

이전 step에서 만들어진 모든 코드를 꼼꼼히 읽고, 각 레이어의 인터페이스를 이해한 뒤 작업하라.

## 작업

### 1. `src/app/page.tsx` — 메인 페이지 조립

`"use client"` 컴포넌트로 구현한다. 앱의 모든 상태를 관리하고, 서비스 호출을 오케스트레이션하고, 컴포넌트를 조립한다.

**상태 변수 — ARCHITECTURE.md "상태 관리 > 상태 변수" 섹션을 정확히 따른다:**

```typescript
const [phase, setPhase] = useState<AppPhase>("idle");
const [url, setUrl] = useState("");
const [report, setReport] = useState<AnalysisReport | null>(null);
const [error, setError] = useState<string | null>(null);
const [inlineError, setInlineError] = useState<string | null>(null);
const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);
const [settingsOpen, setSettingsOpen] = useState(false);
const [commentsMeta, setCommentsMeta] = useState<{ analyzed: number; total: number } | null>(null);
```

**초기화 (useEffect, 마운트 시 1회):**
- `getApiKeys()`로 키 확인. 두 키 중 하나라도 비어 있으면 `setSettingsOpen(true)`.
- `isStorageAvailable()` 결과를 상태에 저장 (ApiKeySettings에 전달용).

**handleAnalyze 함수 — ARCHITECTURE.md "데이터 흐름 > 정상 흐름"을 정확히 구현한다:**

1. `url.trim()` 수행.
2. `extractVideoId(trimmedUrl)` — null이면 `setInlineError("유효한 YouTube URL을 입력해 주세요. (예: https://www.youtube.com/watch?v=...)")`, return.
3. `getApiKeys()` — 빈 값이면 `setInlineError("API 키를 먼저 설정해 주세요.")`, `setSettingsOpen(true)`, return.
4. `setPhase("loading")`, 로딩 단계 3개 초기화 (step[0] = active).
5. `setReport(null)`, `setError(null)`, `setInlineError(null)`.
6. try 블록:
   - `fetchComments(videoId, keys.youtube)` 호출.
   - `comments.length === 0`이면 → `setError("이 영상에 댓글이 없습니다.")`, `setPhase("error")`, return.
   - `setCommentsMeta({ analyzed: comments.length, total: totalResults })`.
   - 로딩 step[0] = done, step[1] = active.
   - `analyzeComments(comments, keys.anthropic)` 호출.
   - sentiment 합계 검증. 100이 아니면 정규화 (각 값 / 합 × 100, 반올림).
   - `setReport(result)`.
   - 로딩 step[1] = done, step[2] = active → done.
   - `setPhase("report")`.
7. catch 블록 — ARCHITECTURE.md "에러 흐름"을 따른다:
   - `mapErrorMessage(err.message)`로 사용자 메시지 변환.
   - `setError(mappedMessage)`, `setPhase("error")`.
   - `isApiKeyError(err.message)`이면 `setSettingsOpen(true)`.

**handleRetry 함수:**
- `handleAnalyze()`를 다시 호출한다. URL은 그대로 유지. (ADR-011)

**handleReset 함수:**
- `setUrl("")`, `setReport(null)`, `setError(null)`, `setInlineError(null)`, `setPhase("idle")`.
- URL 입력 필드에 포커스 이동 (`useRef`로 input ref 관리).

**handleUrlChange 함수:**
- `setUrl(value)`, `setInlineError(null)` (에러 자동 제거).

**handleSaveKeys 함수:**
- `saveApiKeys(keys)`, `setSettingsOpen(false)`.

**handleDeleteKey 함수:**
- `deleteApiKey(type)`. 컴포넌트의 savedKeys 표시를 업데이트하기 위해 상태 갱신.

**페이지 레이아웃 — UI_GUIDE.md "페이지 구조"를 따른다:**

```
<main className="min-h-screen bg-neutral-950">
  <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
    1. 헤더: 앱 제목 "YouTube Comment Analyzer" + 설정 기어 아이콘 (onToggle)
    2. ApiKeySettings (open, onToggle, onSave, onDelete, savedKeys, storageAvailable)
    3. UrlInput (value, onChange, onSubmit, disabled, error)
    4. 콘텐츠 영역 (phase에 따라):
       - idle: EmptyState
       - loading: LoadingState
       - error: ErrorState (message, onRetry, onReset)
       - report: ReportView (report, commentsMeta, onReset)
  </div>
</main>
```

핵심 규칙:
- UrlInput의 `disabled`는 `phase === "loading"`일 때 true.
- UrlInput의 `error`는 `inlineError` (phase가 idle일 때의 검증 에러).
- phase가 "report"일 때도 UrlInput은 보인다 (새 URL 입력 가능). disabled는 false.
- 기어 아이콘은 SVG 인라인으로 구현한다.

### 2. `src/app/layout.tsx` 업데이트

Step 0에서 생성된 layout.tsx를 확인하고, 필요하면 수정한다:
- `<html lang="ko">` 설정 (ADR-009 한국어 고정).
- body 클래스: `bg-neutral-950 text-neutral-100 antialiased`.
- metadata: `title: "YouTube Comment Analyzer"`, `description: "YouTube 영상 댓글을 AI로 분석하여 시청자 반응 리포트를 생성합니다."`.

### 3. `src/app/globals.css` 확인

fade-in 애니메이션을 위한 CSS가 필요하면 추가한다:

```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fade-in 0.3s ease;
}
```

### 4. 테스트

`src/app/page.test.tsx` — 메인 페이지 통합 테스트:

- 초기 렌더링: API 키 없음 → 설정 패널 열림
- 초기 렌더링: API 키 있음 → 설정 패널 닫힘
- 잘못된 URL 입력 → 인라인 에러 표시
- API 키 미설정 → 인라인 에러 + 설정 패널 열림
- URL 수정 시 → 인라인 에러 자동 제거
- 정상 분석 흐름: fetchComments + analyzeComments mock → 리포트 표시
- 에러 흐름: fetchComments 실패 → 에러 상태 표시
- API 키 에러 → 설정 패널 자동 열림
- "다시 시도" → handleAnalyze 재호출
- "다른 영상 분석하기" → URL 비움 + idle 상태

서비스 레이어(`services/*`)를 vi.mock()으로 mock한다. localStorage도 mock한다.

## Acceptance Criteria

```bash
npm run build   # 컴파일 에러 없음
npm test        # 모든 테스트 통과 (이전 step 테스트 포함)
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `page.tsx`가 `"use client"` 컴포넌트인가?
   - ARCHITECTURE.md의 상태 변수 8개가 모두 존재하는가?
   - ARCHITECTURE.md의 상태 전이 테이블의 모든 전이가 올바르게 구현되어 있는가?
   - 에러 시 URL이 유지되는가? (ADR-011)
   - API 키 에러 시 설정 패널이 열리는가? (ADR-012)
   - sentiment 정규화 로직이 있는가?
   - `mapErrorMessage`와 `isApiKeyError`를 `lib/constants.ts`에서 import하여 사용하는가?
   - 서비스 레이어를 `services/`에서 import하여 사용하는가?
   - 외부 API(YouTube, Anthropic)를 직접 호출하지 않는가? (CLAUDE.md CRITICAL)
3. 결과에 따라 `phases/0-mvp/index.json`의 step 8을 업데이트한다.

## 금지사항

- 외부 API(YouTube Data API, Anthropic API)를 page.tsx에서 직접 호출하지 마라. 이유: CLAUDE.md CRITICAL 규칙. 반드시 services/를 통해 내부 API Route를 호출.
- `localStorage`를 page.tsx에서 직접 접근하지 마라. 이유: `lib/storage.ts`를 통해서만 접근.
- 취소 기능을 구현하지 마라. 이유: ADR-010.
- `useReducer`나 외부 상태 관리 라이브러리를 사용하지 마라. 이유: ADR-004, useState로 충분.
- 컴포넌트 파일(`components/`)을 수정하지 마라. 이유: 이미 완성된 컴포넌트. 수정이 필요하면 Props 인터페이스가 일치하지 않는 것이므로, 원인을 먼저 파악하라.
