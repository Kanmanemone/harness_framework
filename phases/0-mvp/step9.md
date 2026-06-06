# Step 9: integration-test

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md` — "엣지 케이스 처리" 테이블 전체
- `/docs/PRD.md` — "사용자 시나리오" 섹션 전체 (18개 시나리오), "에러 메시지 매핑" 테이블
- `/docs/UI_GUIDE.md` — "AI 슬롭 안티패턴" 테이블
- `/docs/ADR.md` — 전체 ADR 목록 (12개)

이전 step에서 만들어진 모든 코드를 읽어라:

- `/src/app/page.tsx` (Step 8)
- `/src/app/layout.tsx` (Step 0, 8)
- `/src/app/globals.css` (Step 0, 8)
- `/src/app/api/youtube/comments/route.ts` (Step 3)
- `/src/app/api/analyze/route.ts` (Step 4)
- `/src/components/*.tsx` (Step 6-7의 모든 컴포넌트)
- `/src/services/*.ts` (Step 5)
- `/src/lib/*.ts` (Step 2)
- `/src/types/index.ts` (Step 1)

모든 코드를 꼼꼼히 읽고, 전체 플로우를 이해한 뒤 작업하라.

## 작업

### 1. 빌드 검증

```bash
npm run build
```

빌드에 실패하면 원인을 파악하고 수정한다. 수정은 최소 범위로 한정한다.

### 2. 기존 테스트 전체 실행

```bash
npm test
```

실패하는 테스트가 있으면 원인을 파악한다:
- 테스트 자체의 문제인 경우: 테스트를 수정한다.
- 구현 코드의 문제인 경우: 구현 코드를 수정한다.
- 수정 시 ARCHITECTURE.md와 ADR.md의 설계 의도를 벗어나지 않도록 주의한다.

### 3. 엣지 케이스 테스트 보강

ARCHITECTURE.md "엣지 케이스 처리" 테이블에 명시된 항목 중, 기존 테스트에서 커버되지 않은 케이스에 대해 테스트를 추가한다.

확인해야 할 엣지 케이스 목록:

**lib/youtube.ts 관련:**
- YouTube Shorts URL (`youtube.com/shorts/VIDEO_ID`) 파싱
- http:// URL 파싱
- www 없는 URL 파싱
- URL 앞뒤 공백 처리 (trim은 page.tsx에서 하지만, extractVideoId 자체의 동작도 확인)

**lib/constants.ts 관련:**
- `mapErrorMessage`에 등록되지 않은 에러 코드 → 기본 메시지 반환
- `buildAnalysisPrompt`에 빈 배열 전달 시 동작

**api/analyze/route.ts 관련:**
- Claude 응답이 코드 펜스로 감싸진 경우 → JSON 추출 성공
- Claude 응답에 JSON 앞뒤 텍스트 포함 → JSON 추출 성공
- sentiment 합계가 100이 아닌 경우 → 클라이언트 정규화 (page.tsx에서 처리하므로, API Route는 그대로 전달)

**components 관련:**
- SentimentChart에 0% 세그먼트 전달 시 렌더링
- InsightCard에 빈 배열 전달 시 미렌더링
- CommentList에 빈 그룹 전달 시 해당 그룹 미렌더링

### 4. 아키텍처 준수 검증

코드 전체를 읽고 다음을 확인한다. 위반 사항이 있으면 수정한다:

**CLAUDE.md CRITICAL 규칙:**
- [ ] 모든 외부 API 호출(YouTube, Anthropic)이 `app/api/` Route Handler에서만 이루어지는가?
- [ ] 클라이언트 컴포넌트에서 외부 API를 직접 호출하지 않는가?
- [ ] 컴포넌트는 `components/`, 타입은 `types/`, 유틸리티는 `lib/`, 서비스는 `services/`에 위치하는가?

**ADR 준수:**
- [ ] ADR-004: Next.js + React 외 런타임 의존성이 없는가? (`package.json` 확인)
- [ ] ADR-007: Claude 프롬프트에서 JSON 직접 출력 + 방어 코드가 있는가?
- [ ] ADR-011: 에러 시 URL이 유지되는가?
- [ ] ADR-012: API 키 에러 시 설정 패널이 자동으로 열리는가?

**UI_GUIDE.md 슬롭 안티패턴:**
- [ ] `backdrop-filter: blur()`를 사용하지 않는가?
- [ ] gradient-text를 사용하지 않는가?
- [ ] box-shadow glow 애니메이션을 사용하지 않는가?
- [ ] 보라/인디고 색상을 사용하지 않는가?
- [ ] `rounded-2xl`을 모든 카드에 균일하게 사용하지 않는가?

### 5. lint 실행

```bash
npm run lint
```

lint 에러가 있으면 수정한다.

## Acceptance Criteria

```bash
npm run build   # 컴파일 에러 없음
npm run lint    # lint 에러 없음
npm test        # 모든 테스트 통과
```

## 검증 절차

1. 위 AC 커맨드 3개를 모두 실행한다.
2. 위 4번(아키텍처 준수 검증)의 모든 체크리스트를 확인한다.
3. 결과에 따라 `phases/0-mvp/index.json`의 step 9를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "산출물 한 줄 요약"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 새로운 기능을 추가하지 마라. 이유: 이 step은 검증과 수정만 수행한다. 기능 추가는 scope 밖.
- 기존 컴포넌트의 Props 인터페이스를 변경하지 마라. 이유: Props 변경은 여러 파일에 영향. 변경이 필요하면 `"status": "blocked"`로 보고하라.
- 테스트를 삭제하여 통과시키지 마라. 이유: 테스트가 실패하면 구현을 수정하라.
- `package.json`에 새 런타임 의존성을 추가하지 마라. 이유: ADR-004.
- `console.log`를 프로덕션 코드에 남기지 마라. 이유: 디버깅용 로그는 테스트 후 제거.
