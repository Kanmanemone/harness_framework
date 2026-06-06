# Step 0: project-setup

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md` — 디렉토리 구조, 기술 스택
- `/docs/ADR.md` — ADR-001(Next.js), ADR-004(제로 의존성), ADR-006(다크모드)

## 작업

### 1. Next.js 15 프로젝트 초기화

프로젝트 루트에서 Next.js 15 프로젝트를 초기화한다. 이미 루트에 `docs/`, `phases/`, `scripts/` 등이 존재하므로, 기존 파일을 덮어쓰지 않도록 주의한다.

생성해야 할 파일 및 설정:

- `package.json` — Next.js 15, React 19, TypeScript 5, Tailwind CSS 4 의존성. devDependencies에 Vitest, @testing-library/react, jsdom 포함.
- `tsconfig.json` — strict mode, `src/` 기준 path alias (`@/*` → `src/*`)
- `next.config.ts` — 최소 설정
- `postcss.config.mjs` — `@tailwindcss/postcss` 플러그인
- `src/app/globals.css` — `@import "tailwindcss"` 한 줄
- `vitest.config.ts` — jsdom 환경, `src/` path alias, `src/**/*.test.ts(x)` 패턴

`package.json`의 scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

### 2. 보일러플레이트 정리

- `src/app/layout.tsx` — 최소 루트 레이아웃. metadata에 title "YouTube Comment Analyzer" 설정. body에 `bg-neutral-950 text-neutral-100` 클래스 적용. 시스템 폰트 사용 (커스텀 폰트 import 없음).
- `src/app/page.tsx` — 빈 placeholder. `export default function Home() { return <main></main>; }` 수준.
- `src/app/globals.css` — Tailwind import만. 다른 커스텀 CSS 없음.
- `favicon.ico` 등 불필요한 Next.js 기본 에셋 삭제.

### 3. 디렉토리 생성

ARCHITECTURE.md에 명시된 빈 디렉토리를 생성한다. 각 디렉토리에 빈 `.gitkeep` 파일을 넣어 git 추적을 보장한다:

```
src/components/
src/types/
src/lib/
src/services/
```

### 4. .gitignore 업데이트

기존 `.gitignore`에 Next.js 관련 항목이 없으면 추가한다:

```
.next/
node_modules/
out/
```

### 5. 의존성 설치 및 빌드 확인

```bash
npm install
npm run build
npm test
```

## Acceptance Criteria

```bash
npm run build   # 컴파일 에러 없음, Next.js 빌드 성공
npm test        # vitest가 실행되고 (테스트 0개라도) 에러 없이 종료
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `src/app/`, `src/components/`, `src/types/`, `src/lib/`, `src/services/` 디렉토리가 존재하는가?
   - `package.json`에 Next.js 15, React 19, TypeScript, Tailwind CSS 4, Vitest가 포함되어 있는가?
   - 외부 런타임 의존성이 Next.js + React 외에 없는가? (ADR-004)
   - `layout.tsx`에 다크모드 배경(`bg-neutral-950`)이 적용되어 있는가? (ADR-006)
3. 결과에 따라 `phases/0-mvp/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `@anthropic-ai/sdk`를 설치하지 마라. 이유: ADR-004에 따라 런타임 의존성 제로 정책.
- `chart.js`, `recharts` 등 차트 라이브러리를 설치하지 마라. 이유: CSS로 구현할 것.
- `zustand`, `jotai`, `redux` 등 상태 관리 라이브러리를 설치하지 마라. 이유: useState로 충분.
- `src/app/page.tsx`에 실제 UI 로직을 넣지 마라. 이유: Step 8에서 작업.
- 기존 `docs/`, `phases/`, `scripts/` 디렉토리의 파일을 수정/삭제하지 마라.
- Next.js의 기본 폰트(Geist 등)를 import하지 마라. 이유: 시스템 폰트 사용.
