/**
 * YouTube URL에서 영상 ID(11자)를 추출한다.
 * 지원 패턴: watch?v=, youtu.be/, embed/, /v/, shorts/
 * URL이 아닌 입력에는 null을 반환한다.
 */
export function extractVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})(?:[&?/]|$)/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?/]|$)/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:[?/]|$)/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})(?:[?/]|$)/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})(?:[?/]|$)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}
