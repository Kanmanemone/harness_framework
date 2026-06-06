# Step 7: ui-containers

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md` — "컴포넌트 Props" 섹션
- `/docs/UI_GUIDE.md` — "API 키 설정 패널", "URL 입력 + 분석 버튼", "리포트" 관련 스펙
- `/docs/PRD.md` — "기능 4: API 키 관리", "사용자 경험 상세" 섹션 전체, "키보드 접근성"
- `/docs/ADR.md` — ADR-011(입력 보존), ADR-012(API 키 에러 시 설정 패널)
- `/src/types/index.ts` (Step 1에서 생성됨)
- `/src/components/` (Step 6에서 생성된 모든 atom 컴포넌트를 읽어라)

이전 step에서 만들어진 코드를 꼼꼼히 읽고, atom 컴포넌트의 인터페이스를 이해한 뒤 작업하라.

## 작업

자체 상태나 이벤트 핸들러를 가지는 컨테이너 컴포넌트를 구현한다. 이 컴포넌트들은 page.tsx에서 props를 받아 동작한다.

### 1. `src/components/ApiKeySettings.tsx`

```typescript
interface ApiKeySettingsProps {
  open: boolean;
  onToggle: () => void;
  onSave: (keys: ApiKeys) => void;
  onDelete: (type: "youtube" | "anthropic") => void;
  savedKeys: ApiKeys;
  storageAvailable: boolean;
}
```

- UI_GUIDE.md "API 키 설정 패널" 스펙을 따른다.
- `open`이 false이면 패널을 렌더링하지 않는다 (hidden).
- 두 개의 password 타입 입력 필드: YouTube API 키, Anthropic API 키.
- `savedKeys`가 비어 있지 않으면 마스킹된 값 표시 (예: 앞 6자 + "..." + 뒤 4자).
- 각 키 입력란 아래에 안내 텍스트 + 발급 콘솔 링크:
  - YouTube: "Google Cloud Console에서 YouTube Data API v3를 활성화하고 API 키를 발급받으세요." + 링크
  - Anthropic: "Anthropic Console에서 API 키를 발급받으세요." + 링크
- 키가 저장된 상태: 체크마크 아이콘 + "삭제" 버튼 표시.
- `storageAvailable`이 false이면: "시크릿 모드에서는 API 키가 저장되지 않습니다." 안내.
- "저장" 버튼: 내부 입력 상태의 값으로 `onSave`를 호출한다.

핵심 규칙:
- 컴포넌트 내부에 입력 필드의 임시 상태(`useState`)를 가진다. 이 상태는 "저장" 버튼 클릭 시에만 부모에게 전달된다.
- 링크의 href는 `https://console.cloud.google.com/`과 `https://console.anthropic.com/`이다.
- `target="_blank"` + `rel="noopener noreferrer"`를 링크에 적용한다.

### 2. `src/components/UrlInput.tsx`

```typescript
interface UrlInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  error: string | null;
}
```

- UI_GUIDE.md "URL 입력 + 분석 버튼" 스펙을 따른다.
- 입력 필드: 플레이스홀더 "YouTube 영상 URL을 붙여넣으세요".
- `disabled`가 true이면 입력 필드와 버튼 모두 비활성화.
- `error`가 있으면 입력 필드 아래에 에러 메시지 표시 + 입력 필드 보더를 `border-red-400/50`으로 변경.
- Enter 키를 누르면 `onSubmit`을 호출한다 (`onKeyDown` 핸들러).
- `onChange` 호출 시 부모에서 `inlineError`를 null로 설정할 수 있도록, 값 변경만 전달한다.
- 버튼 텍스트: "분석".
- 버튼은 `value`가 빈 문자열이거나 `disabled`가 true이면 비활성화.

### 3. `src/components/ReportView.tsx`

```typescript
interface ReportViewProps {
  report: AnalysisReport;
  commentsMeta: { analyzed: number; total: number };
  onReset: () => void;
}
```

- Step 6에서 만든 atom 컴포넌트들을 조립한다:
  1. `ReportHeader` — commentsMeta 전달
  2. 요약 텍스트 — `report.summary` (text-base text-neutral-200 leading-relaxed)
  3. `SentimentChart` — `report.sentiment` 전달
  4. `InsightCard` — title "잘하고 있는 점", items `report.strengths`, variant "positive"
  5. `InsightCard` — title "개선할 점", items `report.improvements`, variant "negative"
  6. `CommentList` — `report.representativeComments` 전달
  7. "다른 영상 분석하기" 버튼 — `onReset` 호출
- 전체를 `space-y-6`로 배치한다.
- fade-in 애니메이션: 컨테이너에 CSS animation `opacity 0→1, 0.3s ease` 적용.

### 4. 단위 테스트

- `src/components/ApiKeySettings.test.tsx` — 패널 열기/닫기, 키 입력 + 저장, 삭제 버튼, 마스킹 표시, 시크릿 모드 안내
- `src/components/UrlInput.test.tsx` — 입력 변경, Enter 제출, disabled 상태, 에러 메시지 표시/숨김, 빈 값일 때 버튼 disabled
- `src/components/ReportView.test.tsx` — 모든 하위 컴포넌트가 렌더링되는지, onReset 호출

## Acceptance Criteria

```bash
npm run build   # 컴파일 에러 없음
npm test        # 모든 테스트 통과 (이전 step 테스트 포함)
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - ApiKeySettings가 password 타입 입력 필드를 사용하는가?
   - UrlInput에서 Enter 키 제출이 동작하는가?
   - ReportView가 Step 6의 atom 컴포넌트를 올바르게 조립하는가?
   - fade-in 애니메이션이 ReportView에 적용되어 있는가?
   - UI_GUIDE.md의 disabled 스타일(opacity-30 등)을 사용하는가?
   - 외부 링크에 `target="_blank" rel="noopener noreferrer"`가 적용되어 있는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 step 7을 업데이트한다.

## 금지사항

- `page.tsx`를 수정하지 마라. 이유: Step 8에서 작업.
- 서비스 레이어(`services/`)를 import하지 마라. 이유: API 호출은 page.tsx에서 처리. 컴포넌트는 props만 받는다.
- `localStorage`를 컴포넌트에서 직접 접근하지 마라. 이유: storage 접근은 `lib/storage.ts`를 통해서만. 컴포넌트는 `savedKeys` props를 받는다.
- `useEffect`로 API를 호출하지 마라. 이유: 데이터 fetch는 page.tsx의 이벤트 핸들러에서 처리.
