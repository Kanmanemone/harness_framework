# Step 6: ui-atoms

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md` — "컴포넌트 Props" 섹션
- `/docs/UI_GUIDE.md` — 전체. 특히 "색상", "컴포넌트", "타이포그래피", "인터랙티브 상태" 섹션.
- `/docs/PRD.md` — "핵심 기능 > 기능 3: 리포트 표시" 섹션
- `/src/types/index.ts` (Step 1에서 생성됨)
- `/src/app/globals.css` (Step 0에서 생성됨)

이전 step에서 만들어진 코드를 꼼꼼히 읽고, 타입 정의와 UI 가이드를 이해한 뒤 작업하라.

## 작업

Props가 간단하고 자체 상태가 없는 표시 전용 컴포넌트(atoms)를 구현한다. 모든 컴포넌트는 UI_GUIDE.md의 색상, 타이포그래피, 컴포넌트 스타일을 따른다.

### 1. `src/components/SentimentChart.tsx`

```typescript
interface SentimentChartProps {
  sentiment: SentimentRatio;
}
```

- 가로 바 차트: flex 컨테이너, 각 세그먼트의 width를 퍼센트로 설정.
- 0%가 아닌 세그먼트는 최소 2% 너비 표시 (너무 작으면 안 보이므로).
- 바 아래에 레이블: "긍정 65%", "중립 25%", "부정 10%" — UI_GUIDE.md 시맨틱 색상 사용.
- 차트 라이브러리를 사용하지 않는다. CSS flex만 사용.

### 2. `src/components/InsightCard.tsx`

```typescript
interface InsightCardProps {
  title: string;
  items: string[];
  variant: "positive" | "negative";
}
```

- UI_GUIDE.md "인사이트 카드" 스펙을 따른다.
- variant에 따라 제목 색상 변경: positive → text-emerald-400, negative → text-red-400.
- 카드 스타일: `rounded-lg bg-neutral-900 border border-neutral-800 p-6`.
- items가 빈 배열이면 카드를 렌더링하지 않는다.

### 3. `src/components/CommentList.tsx`

```typescript
interface CommentListProps {
  comments: AnalysisReport["representativeComments"];
}
```

- UI_GUIDE.md "대표 댓글 목록" 스펙을 따른다.
- 센티먼트별 그룹: 긍정, 중립, 부정 순서.
- 각 그룹에 센티먼트 뱃지 (bg-emerald-400/10 text-emerald-400 등).
- 각 댓글: 텍스트(italic) + 작성자(text-xs text-neutral-600).
- 빈 그룹(댓글 0개)은 해당 그룹을 렌더링하지 않는다.

### 4. `src/components/ReportHeader.tsx`

```typescript
interface ReportHeaderProps {
  analyzed: number;
  total: number;
}
```

- "100개 댓글 분석 (전체 1,523개 중)" 형식의 텍스트.
- `total`은 1000 이상이면 쉼표 포맷팅 (예: 1,523).
- UI_GUIDE.md: `text-sm text-neutral-500`.

### 5. `src/components/EmptyState.tsx`

```typescript
// Props 없음
```

- UI_GUIDE.md "빈 상태 안내" 스펙을 따른다.
- "YouTube 영상의 댓글을 AI로 분석하여 시청자 반응 리포트를 생성합니다." 텍스트.
- `text-center py-12 text-sm text-neutral-500 leading-relaxed`

### 6. `src/components/ErrorState.tsx`

```typescript
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  onReset: () => void;
}
```

- UI_GUIDE.md "에러 상태" 스펙을 따른다.
- 에러 카드: `rounded-lg bg-red-400/5 border border-red-400/20 p-6`.
- X 마크 아이콘 + 에러 메시지 + 버튼 그룹("다시 시도" Primary, "다른 영상 분석하기" Text).

### 7. `src/components/LoadingState.tsx`

```typescript
interface LoadingStateProps {
  steps: LoadingStep[];
}
```

- UI_GUIDE.md "로딩 상태" 스펙을 따른다.
- 각 단계: 아이콘(스피너/체크마크/빈 원) + 텍스트.
- active: animate-spin 스피너 + text-neutral-100.
- done: 체크마크 + text-neutral-500.
- pending: 빈 원 + text-neutral-700.
- 스피너와 체크마크는 인라인 SVG로 구현한다 (아이콘 라이브러리 없이).

### 8. 단위 테스트

각 컴포넌트에 대한 테스트 파일을 `src/components/` 디렉토리에 생성한다:

- `SentimentChart.test.tsx` — 비율에 따른 렌더링, 0% 세그먼트 처리, 레이블 표시
- `InsightCard.test.tsx` — positive/negative variant, 빈 배열 처리
- `CommentList.test.tsx` — 센티먼트별 그룹 렌더링, 빈 그룹 숨김
- `ReportHeader.test.tsx` — 숫자 포맷팅
- `ErrorState.test.tsx` — 메시지 표시, 버튼 클릭 핸들러 호출
- `LoadingState.test.tsx` — active/done/pending 상태별 렌더링

React 컴포넌트 테스트에는 `@testing-library/react`를 사용한다.

## Acceptance Criteria

```bash
npm run build   # 컴파일 에러 없음
npm test        # 모든 테스트 통과 (이전 step 테스트 포함)
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 모든 컴포넌트가 `src/components/`에 위치하는가?
   - UI_GUIDE.md의 색상값, 클래스를 정확히 사용하는가?
   - 슬롭 안티패턴(backdrop-blur, gradient-text, rounded-2xl 등)을 사용하지 않았는가?
   - 차트 라이브러리를 import하지 않았는가? (ADR-004)
   - 아이콘 라이브러리를 import하지 않았는가? SVG 인라인을 사용하는가?
   - `types/index.ts`의 타입을 올바르게 import하여 Props에 사용하는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 step 6을 업데이트한다.

## 금지사항

- `lucide-react`, `heroicons`, `react-icons` 등 아이콘 라이브러리를 설치하지 마라. 이유: ADR-004. SVG 인라인으로 구현.
- `chart.js`, `recharts`, `d3` 등 차트 라이브러리를 설치하지 마라. 이유: ADR-004.
- backdrop-filter, gradient-text, box-shadow glow, 보라색 등 슬롭 안티패턴을 사용하지 마라. 이유: UI_GUIDE.md 금지 목록.
- 컴포넌트에 자체 상태(`useState`)를 추가하지 마라. 이유: atoms는 props만 받는 표시 전용 컴포넌트. 상태는 Step 7-8에서 처리.
- `page.tsx`를 수정하지 마라. 이유: Step 8에서 작업.
