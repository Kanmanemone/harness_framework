# Step 1: core-types

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md` — "타입 정의" 섹션 전체, "컴포넌트 Props" 섹션
- `/docs/PRD.md` — "핵심 기능" 섹션 (데이터 구조 이해용)
- `/src/app/layout.tsx` (Step 0에서 생성됨 — 프로젝트 구조 확인용)

## 작업

### `src/types/index.ts` 생성

ARCHITECTURE.md "타입 정의" 섹션에 명시된 모든 인터페이스를 `export`한다.

정의해야 할 타입:

```typescript
// YouTube 관련
export interface Comment { ... }
export interface YouTubeCommentsResponse { ... }

// 분석 결과
export interface SentimentRatio { ... }
export interface RepresentativeComment { ... }
export interface AnalysisReport { ... }

// 앱 상태
export type AppPhase = "idle" | "loading" | "report" | "error";
export interface LoadingStep { ... }
export interface ApiKeys { ... }
export interface ApiError { ... }  // isApiKeyError?: boolean 포함
```

각 인터페이스의 필드는 ARCHITECTURE.md "타입 정의" 섹션의 정의를 정확히 따른다. JSDoc 주석으로 각 필드의 의미를 설명한다.

### `src/types/index.test.ts` 생성

타입이 올바르게 export되는지 확인하는 간단한 테스트. 각 타입으로 객체를 생성하고 타입 호환성을 검증한다. 런타임 assertion은 최소화하되, `import`가 성공하고 타입 체크가 통과하는지 확인한다.

## Acceptance Criteria

```bash
npm run build   # 컴파일 에러 없음
npm test        # 타입 테스트 통과
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `src/types/index.ts`에 ARCHITECTURE.md에 명시된 모든 인터페이스가 export되어 있는가?
   - `Comment`, `AnalysisReport`, `AppPhase`, `ApiKeys`, `ApiError` 등 모든 타입이 존재하는가?
   - `ApiError`에 `isApiKeyError?: boolean` 필드가 포함되어 있는가?
   - `SentimentRatio`의 세 필드(positive, neutral, negative)가 number 타입인가?
3. 결과에 따라 `phases/0-mvp/index.json`의 step 1을 업데이트한다.

## 금지사항

- 타입에 메서드를 추가하지 마라. 이유: 순수 데이터 구조만 정의한다. 로직은 lib/에서 처리.
- `class`를 사용하지 마라. 이유: `interface`와 `type`만 사용한다.
- ARCHITECTURE.md에 없는 타입을 추가하지 마라. 이유: 문서와 코드의 일관성 유지.
- `.gitkeep` 파일을 삭제하지 마라. 이유: 아직 파일이 없는 디렉토리의 git 추적용.
