# 아키텍처

## 디렉토리 구조
```
src/
├── app/
│   ├── layout.tsx                    # 루트 레이아웃 (메타데이터, 글로벌 스타일)
│   ├── page.tsx                      # 메인 페이지 (단일 페이지 앱, Client Component)
│   ├── globals.css                   # Tailwind 디렉티브
│   └── api/
│       ├── youtube/comments/
│       │   └── route.ts              # YouTube Data API v3 프록시
│       └── analyze/
│           └── route.ts              # Anthropic Claude API 프록시
├── components/
│   ├── ApiKeySettings.tsx            # API 키 입력 패널 (접을 수 있음)
│   ├── UrlInput.tsx                  # YouTube URL 입력 + 분석 버튼
│   ├── LoadingState.tsx              # 3단계 진행 표시기
│   ├── ReportView.tsx                # 리포트 전체 컨테이너
│   ├── SentimentChart.tsx            # 센티먼트 비율 바 (CSS only)
│   ├── InsightCard.tsx               # 강점/개선점 카드 (재사용)
│   └── CommentList.tsx               # 대표 댓글 목록
├── types/
│   └── index.ts                      # 모든 TypeScript 인터페이스
├── lib/
│   ├── youtube.ts                    # YouTube URL 파싱, videoId 추출
│   ├── storage.ts                    # localStorage 헬퍼 (API 키 저장/조회)
│   └── constants.ts                  # Claude 프롬프트 템플릿, 설정 상수
└── services/
    ├── youtubeService.ts             # /api/youtube/comments 호출 래퍼
    └── analyzeService.ts             # /api/analyze 호출 래퍼
```

## 패턴
- `page.tsx`만 Client Component (`"use client"`). 나머지는 필요에 따라 결정.
- API 라우트는 외부 API(YouTube, Anthropic)에 대한 서버사이드 프록시 역할. 클라이언트에서 직접 외부 API를 호출하지 않는다.
- Anthropic SDK를 사용하지 않고 `fetch`로 직접 Messages API를 호출한다.
- 외부 UI/차트 라이브러리 없이 Tailwind CSS만으로 UI를 구성한다.

## 데이터 흐름
```
사용자: YouTube URL 입력
    ↓
Client (page.tsx): videoId 추출 + API 키 확인
    ↓
GET /api/youtube/comments?videoId=...&apiKey=...
    ↓
API Route → YouTube Data API v3 (commentThreads.list) → 댓글 변환
    ↓
Client: 댓글 수신
    ↓
POST /api/analyze { comments, apiKey }
    ↓
API Route → Anthropic Messages API (claude-sonnet-4-20250514) → JSON 리포트 파싱
    ↓
Client: AnalysisReport 수신 → ReportView 렌더링
```

## 상태 관리
- 서버 상태: 없음 (DB 미사용)
- 클라이언트 상태: `useState`로 관리
  - `phase`: `"idle"` | `"loading"` | `"report"` | `"error"` — 현재 앱 단계
  - `report`: `AnalysisReport | null` — 분석 결과
  - `error`: `string | null` — 에러 메시지
  - `loadingSteps`: 3단계 진행 상태 (댓글 수집 → 분석 중 → 리포트 생성)
- API 키: `localStorage`에 저장. `lib/storage.ts`를 통해 접근.
