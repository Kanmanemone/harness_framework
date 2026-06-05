# UI 디자인 가이드

## 디자인 원칙
1. 도구처럼 보여야 한다. 마케팅 페이지가 아니라 매일 쓰는 분석 도구.
2. 정보 밀도 우선. 장식을 줄이고 데이터가 주인공이 되게 한다.
3. 상태 전환이 명확해야 한다. 사용자가 지금 어떤 단계에 있는지 항상 알 수 있다.

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

## 색상
### 배경
| 용도 | 값 |
|------|------|
| 페이지 | bg-neutral-950 (#0a0a0a) |
| 카드 | bg-neutral-900 (#171717) |
| 카드 보더 | border-neutral-800 |

### 텍스트
| 용도 | 값 |
|------|------|
| 주 텍스트 | text-neutral-100 |
| 본문 | text-neutral-300 |
| 보조 | text-neutral-500 |
| 비활성 | text-neutral-600 |

### 데이터/시맨틱 색상
| 용도 | 텍스트 | 배경/바 |
|------|--------|---------|
| 긍정 | text-emerald-400 | bg-emerald-400 |
| 부정 | text-red-400 | bg-red-400 |
| 중립 | text-neutral-400 | bg-neutral-500 |

## 컴포넌트
### 카드
```
rounded-lg bg-neutral-900 border border-neutral-800 p-6
```

### 버튼
```
Primary: rounded-lg bg-white text-black font-medium px-4 py-2.5 hover:bg-neutral-200 transition-colors
Text:    text-neutral-500 hover:text-neutral-300 transition-colors
```

### 입력 필드
```
rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-3 text-neutral-100
placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none transition-colors
```

### 센티먼트 바
```
flex 컨테이너, 각 세그먼트는 percentage width로 구현.
높이: h-3, rounded-full. 차트 라이브러리 사용하지 않음.
```

## 레이아웃
- 전체 너비: max-w-2xl mx-auto
- 정렬: 좌측 정렬 기본
- 페이지 패딩: px-4 py-8
- 섹션 간격: space-y-6
- 카드 내부 간격: space-y-4

## 타이포그래피
| 용도 | 스타일 |
|------|--------|
| 앱 제목 | text-xl font-semibold text-neutral-100 |
| 섹션 제목 | text-base font-medium text-neutral-100 |
| 카드 제목 | text-sm font-medium text-neutral-400 uppercase tracking-wide |
| 본문 | text-sm text-neutral-300 leading-relaxed |
| 댓글 텍스트 | text-sm text-neutral-300 italic |
| 댓글 작성자 | text-xs text-neutral-500 |

## 애니메이션
- fade-in (opacity 0→1, 0.3s ease) — 리포트 표시 시 사용
- 그 외 모든 애니메이션 금지. 스피너는 Tailwind animate-spin 사용.

## 아이콘
- 최소한으로 사용. 설정 기어, 체크마크, 에러 X 정도만.
- SVG 인라인, strokeWidth 1.5
- 아이콘 컨테이너(둥근 배경 박스)로 감싸지 않는다
