// YouTube 관련

/** YouTube 댓글 */
export interface Comment {
  /** YouTube 댓글 고유 ID */
  id: string;
  /** 댓글 본문 (plainText) */
  text: string;
  /** 작성자 이름 */
  author: string;
  /** 좋아요 수 */
  likeCount: number;
  /** 작성 시각 (ISO 8601) */
  publishedAt: string;
}

/** YouTube 댓글 수집 API 응답 */
export interface YouTubeCommentsResponse {
  /** 수집된 댓글 목록 */
  comments: Comment[];
  /** YouTube가 보고하는 전체 댓글 수 */
  totalResults: number;
  /** 영상 ID */
  videoId: string;
}

// 분석 결과

/** 센티먼트 비율 (합계 100) */
export interface SentimentRatio {
  /** 긍정 비율 (0-100) */
  positive: number;
  /** 중립 비율 (0-100) */
  neutral: number;
  /** 부정 비율 (0-100) */
  negative: number;
}

/** 대표 댓글 */
export interface RepresentativeComment {
  /** 원문 그대로 */
  text: string;
  /** 작성자 이름 */
  author: string;
}

/** AI 분석 리포트 */
export interface AnalysisReport {
  /** 전체 요약 (1-2문장) */
  summary: string;
  /** 센티먼트 비율 */
  sentiment: SentimentRatio;
  /** 잘하고 있는 점 (최대 5개) */
  strengths: string[];
  /** 개선할 점 (최대 5개) */
  improvements: string[];
  /** 센티먼트별 대표 댓글 (각 2-3개) */
  representativeComments: {
    positive: RepresentativeComment[];
    neutral: RepresentativeComment[];
    negative: RepresentativeComment[];
  };
}

// 앱 상태

/** 앱 진행 단계 */
export type AppPhase = "idle" | "loading" | "report" | "error";

/** 로딩 진행 단계 */
export interface LoadingStep {
  /** 단계 설명 텍스트 */
  label: string;
  /** 단계 상태 */
  status: "pending" | "active" | "done";
}

/** API 키 저장 구조 */
export interface ApiKeys {
  /** YouTube Data API v3 키 */
  youtube: string;
  /** Gemini API 키 */
  gemini: string;
}

/** API 에러 응답 */
export interface ApiError {
  /** 에러 메시지 */
  error: string;
  /** true면 API 키 관련 에러 — 설정 패널 자동 열기 */
  isApiKeyError?: boolean;
}
