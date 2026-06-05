# UI 디자인 가이드

## 디자인 원칙
1. 도구처럼 보여야 한다. 마케팅 페이지가 아니라 매일 쓰는 분석 도구.
2. 정보 밀도 우선. 장식을 줄이고 데이터가 주인공이 되게 한다.
3. 상태 전환이 명확해야 한다. 사용자가 지금 어떤 단계에 있는지 항상 알 수 있다.
4. 에러가 발생하면 사용자가 무엇을 해야 하는지 바로 알 수 있어야 한다.
5. 입력을 잃지 않는다. 에러가 발생해도 사용자가 입력한 URL은 유지한다.

## AI 슬롭 안티패턴 — 하지 마라
| 금지 사항 | 이유 |
|-----------|------|
| backdrop-filter: blur() | glass morphism은 AI 템플릿의 가장 흔한 징후 |
| gradient-text (배경 그라데이션 텍스트) | AI가 만든 SaaS 랜딩의 1번 특징 |
| "Powered by AI" 배지 | 기능이 아니라 장식. 사용자에게 가치 없음 |
| box-shadow 글로우 애니메이션 | 네온 글로우 = AI 슬롭 |
| 보라/인디고 브랜드 색상 | "AI = 보라색" 클리셰 |
| 모든 카드에 동일한 rounded-2xl | 균일한 둥근 모서리는 템플릿 느낌 |
| 배경 gradient orb (blur-3xl 원형) | 모든 AI 랜딩 페이지에 있는 장식 |

---

## 색상
### 배경
| 용도 | 값 |
|------|------|
| 페이지 | bg-neutral-950 (#0a0a0a) |
| 카드 | bg-neutral-900 (#171717) |
| 카드 보더 | border-neutral-800 |
| 입력 필드 보더 | border-neutral-700 |
| 입력 필드 포커스 보더 | border-neutral-500 |

### 텍스트
| 용도 | 값 |
|------|------|
| 주 텍스트 | text-neutral-100 |
| 본문 | text-neutral-300 |
| 보조/설명 | text-neutral-500 |
| 비활성/플레이스홀더 | text-neutral-600 |

### 데이터/시맨틱 색상
| 용도 | 텍스트 | 배경/바 | 뱃지 배경 |
|------|--------|---------|-----------|
| 긍정 | text-emerald-400 | bg-emerald-400 | bg-emerald-400/10 |
| 부정 | text-red-400 | bg-red-400 | bg-red-400/10 |
| 중립 | text-neutral-400 | bg-neutral-500 | bg-neutral-500/10 |

### 인터랙티브 상태 색상
| 용도 | 값 |
|------|------|
| 에러 텍스트 | text-red-400 |
| 에러 보더 | border-red-400/50 |
| 에러 배경 | bg-red-400/5 |
| 성공 체크마크 | text-emerald-400 |
| 링크 | text-neutral-400 underline hover:text-neutral-200 |

---

## 컴포넌트

### 페이지 헤더
```
flex justify-between items-center
  좌: 앱 제목 (text-xl font-semibold text-neutral-100)
  우: 설정 기어 아이콘 버튼 (text-neutral-500 hover:text-neutral-300)
```

### API 키 설정 패널 (ApiKeySettings)
```
접혀 있을 때: 보이지 않음 (height 0, overflow hidden)
펼쳐져 있을 때:
  rounded-lg bg-neutral-900 border border-neutral-800 p-6 space-y-4
  각 키 입력:
    라벨 (text-sm text-neutral-400) + 상태 표시 (체크마크 또는 "미설정")
    input (password type) + 삭제 버튼 (키가 있는 경우만)
    안내 텍스트 (text-xs text-neutral-600) + 발급 링크
  하단: "저장" 버튼 (Primary)
  시크릿 모드 안내 (storageAvailable이 false일 때):
    text-xs text-neutral-500, "시크릿 모드에서는 API 키가 저장되지 않습니다."
```

### URL 입력 + 분석 버튼 (UrlInput)
```
flex gap-3
  input:
    flex-1 rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-3 text-neutral-100
    placeholder: "YouTube 영상 URL을 붙여넣으세요" (text-neutral-600)
    focus: border-neutral-500 outline-none
    disabled: opacity-50 cursor-not-allowed
    에러 시: border-red-400/50
  버튼:
    rounded-lg bg-white text-black font-medium px-5 py-3
    hover: bg-neutral-200
    disabled: opacity-30 cursor-not-allowed (bg-white 유지, 텍스트도 유지하되 흐리게)
  에러 메시지 (input 아래):
    text-sm text-red-400 mt-1.5
  Enter 키: onSubmit 호출
  onChange: inlineError 자동 제거
```

### 빈 상태 안내 (EmptyState)
```
text-center py-12
  text-sm text-neutral-500 leading-relaxed
  "YouTube 영상의 댓글을 AI로 분석하여\n시청자 반응 리포트를 생성합니다."
```

### 로딩 상태 (LoadingState)
```
space-y-3 py-8
  각 단계 (flex items-center gap-3):
    아이콘:
      active: animate-spin 스피너 (text-neutral-100, w-4 h-4)
      done: 체크마크 (text-emerald-400, w-4 h-4)
      pending: 빈 원 (text-neutral-700, w-4 h-4)
    텍스트:
      active: text-sm text-neutral-100
      done: text-sm text-neutral-500
      pending: text-sm text-neutral-700
```

### 에러 상태 (ErrorState)
```
rounded-lg bg-red-400/5 border border-red-400/20 p-6
  flex items-start gap-3
    아이콘: X 마크 (text-red-400, w-5 h-5, flex-shrink-0)
    내용: space-y-3
      에러 메시지 (text-sm text-neutral-300)
      버튼 그룹 (flex gap-3):
        "다시 시도" 버튼 (Primary)
        "다른 영상 분석하기" 버튼 (Text)
```

### 카드
```
rounded-lg bg-neutral-900 border border-neutral-800 p-6
```

### 버튼
```
Primary:  rounded-lg bg-white text-black font-medium px-4 py-2.5 hover:bg-neutral-200 transition-colors
          disabled: opacity-30 cursor-not-allowed
Text:     text-neutral-500 hover:text-neutral-300 transition-colors text-sm
          disabled: opacity-30 cursor-not-allowed
```

### 입력 필드
```
rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-3 text-neutral-100
placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none transition-colors
disabled: opacity-50 cursor-not-allowed
에러: border-red-400/50
```

### 센티먼트 바 (SentimentChart)
```
전체 컨테이너:
  space-y-2

바:
  flex w-full h-3 rounded-full overflow-hidden
    긍정 세그먼트: bg-emerald-400, width = {positive}%
    중립 세그먼트: bg-neutral-500, width = {neutral}%
    부정 세그먼트: bg-red-400, width = {negative}%
  최소 너비: 각 세그먼트가 0%가 아닌 경우 최소 2% 표시 (너무 작으면 안 보이므로)

레이블 (바 아래):
  flex justify-between text-xs
    긍정: text-emerald-400 "긍정 65%"
    중립: text-neutral-400 "중립 25%"
    부정: text-red-400 "부정 10%"
```

### 리포트 헤더 (ReportHeader)
```
text-sm text-neutral-500
  "100개 댓글 분석 (전체 1,523개 중)"
```

### 인사이트 카드 (InsightCard)
```
카드 기본 스타일 + space-y-3
  제목 행:
    positive variant: text-emerald-400 텍스트 "잘하고 있는 점"
    negative variant: text-red-400 텍스트 "개선할 점"
    text-sm font-medium
  리스트:
    ul space-y-2
      각 항목: flex items-start gap-2
        불릿: "·" (text-neutral-600)
        텍스트: text-sm text-neutral-300
```

### 대표 댓글 목록 (CommentList)
```
space-y-6
  섹션 제목: "대표 댓글" (text-base font-medium text-neutral-100)

  센티먼트별 그룹 (space-y-4):
    그룹 라벨 (센티먼트 뱃지):
      긍정: text-xs px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400 "긍정"
      중립: text-xs px-2 py-0.5 rounded bg-neutral-500/10 text-neutral-400 "중립"
      부정: text-xs px-2 py-0.5 rounded bg-red-400/10 text-red-400 "부정"

    댓글 카드 (각각):
      py-3 border-b border-neutral-800 last:border-0
        댓글 텍스트: text-sm text-neutral-300 italic leading-relaxed "댓글 내용"
        작성자: text-xs text-neutral-600 mt-1 "— 작성자명"
```

---

## 레이아웃

### 전체 페이지
```
min-h-screen bg-neutral-950
  max-w-2xl mx-auto px-4 py-8 space-y-6
```

### 페이지 구조 (위→아래)
```
1. 헤더 (제목 + 기어 아이콘)
2. API 키 설정 패널 (접기/펴기)
3. URL 입력 + 분석 버튼
4. 콘텐츠 영역 (phase에 따라 변경):
   - idle: EmptyState (안내 텍스트)
   - loading: LoadingState (3단계)
   - error: ErrorState (에러 카드)
   - report: ReportView (리포트 전체)
```

### 간격 규칙
- 섹션 간: space-y-6
- 카드 내부: space-y-4
- 리스트 항목 간: space-y-2
- 인라인 요소 간: gap-3

---

## 타이포그래피
| 용도 | 스타일 |
|------|--------|
| 앱 제목 | text-xl font-semibold text-neutral-100 |
| 섹션 제목 | text-base font-medium text-neutral-100 |
| 카드 제목 | text-sm font-medium (색상은 variant에 따라) |
| 본문 | text-sm text-neutral-300 leading-relaxed |
| 요약 텍스트 | text-base text-neutral-200 leading-relaxed |
| 댓글 텍스트 | text-sm text-neutral-300 italic leading-relaxed |
| 댓글 작성자 | text-xs text-neutral-600 |
| 안내/보조 텍스트 | text-sm text-neutral-500 |
| 에러 메시지 (인라인) | text-sm text-red-400 |
| 통계 숫자 | text-xs (색상은 시맨틱에 따라) |
| 뱃지 텍스트 | text-xs |

---

## 애니메이션
- **fade-in**: opacity 0→1, 0.3s ease — 리포트 표시 시 사용
- **animate-spin**: Tailwind 기본 — 로딩 스피너에 사용
- 그 외 모든 애니메이션 금지.
- 설정 패널 접기/펴기는 애니메이션 없이 즉시 전환 (height toggle).

---

## 인터랙티브 상태

### 포커스
- 입력 필드: `focus:border-neutral-500 focus:outline-none`
- 버튼: `focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950`

### Hover
- Primary 버튼: `hover:bg-neutral-200`
- Text 버튼: `hover:text-neutral-300`
- 기어 아이콘: `hover:text-neutral-300`
- 링크: `hover:text-neutral-200`

### Disabled
- 입력 필드: `opacity-50 cursor-not-allowed`
- Primary 버튼: `opacity-30 cursor-not-allowed` (hover 효과 제거)
- Text 버튼: `opacity-30 cursor-not-allowed`

---

## 아이콘
- 최소한으로 사용. 다음만 허용:
  - 설정 기어 (헤더 우측)
  - 체크마크 (로딩 완료 단계, API 키 저장됨)
  - X 마크 (에러 상태)
  - 스피너 (로딩 중)
  - 빈 원 (로딩 대기 단계)
  - 삭제 (API 키 삭제 버튼, 쓰레기통 또는 X)
- SVG 인라인, strokeWidth 1.5, w-4 h-4 (기본) 또는 w-5 h-5 (에러)
- 아이콘 컨테이너(둥근 배경 박스)로 감싸지 않는다
