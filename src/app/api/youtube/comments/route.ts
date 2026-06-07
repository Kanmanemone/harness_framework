import { YOUTUBE_TIMEOUT_MS } from "@/lib/constants";
import type { Comment, YouTubeCommentsResponse } from "@/types";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  const apiKey = searchParams.get("apiKey") || process.env.YOUTUBE_API_KEY;
  const maxResults = searchParams.get("maxResults") ?? "100";

  if (!videoId || !apiKey) {
    return Response.json(
      { error: "Missing videoId or apiKey" },
      { status: 400 }
    );
  }

  const ytUrl =
    `https://www.googleapis.com/youtube/v3/commentThreads` +
    `?part=snippet&videoId=${videoId}&maxResults=${maxResults}` +
    `&order=relevance&textFormat=plainText&key=${apiKey}`;

  let res: globalThis.Response;
  try {
    res = await fetch(ytUrl, {
      signal: AbortSignal.timeout(YOUTUBE_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return Response.json(
        { error: "YouTube API timeout" },
        { status: 504 }
      );
    }
    return Response.json(
      { error: "Failed to reach YouTube API" },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const body = await res.json();
    const reason = body?.error?.errors?.[0]?.reason as string | undefined;
    const message = body?.error?.message as string | undefined;

    if (reason === "commentsDisabled") {
      return Response.json({ error: "commentsDisabled" }, { status: 403 });
    }
    if (reason === "quotaExceeded") {
      return Response.json({ error: "quotaExceeded" }, { status: 403 });
    }
    if (reason === "videoNotFound") {
      return Response.json({ error: "videoNotFound" }, { status: 404 });
    }
    if (res.status === 400) {
      return Response.json(
        { error: `YouTube API error: ${message ?? "Bad request"}`, isApiKeyError: true },
        { status: 400 }
      );
    }

    return Response.json(
      { error: message ?? "Unknown YouTube API error" },
      { status: res.status }
    );
  }

  const data = await res.json();

  const comments: Comment[] = (data.items ?? []).map(
    (item: { id: string; snippet: { topLevelComment: { snippet: { textDisplay: string; authorDisplayName: string; likeCount: number; publishedAt: string } } } }) => ({
      id: item.id,
      text: item.snippet.topLevelComment.snippet.textDisplay,
      author: item.snippet.topLevelComment.snippet.authorDisplayName,
      likeCount: item.snippet.topLevelComment.snippet.likeCount,
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
    })
  );

  // 영상 제목 가져오기
  let videoTitle = "";
  try {
    const videoUrl =
      `https://www.googleapis.com/youtube/v3/videos` +
      `?part=snippet&id=${videoId}&fields=items/snippet/title&key=${apiKey}`;
    const videoRes = await fetch(videoUrl, {
      signal: AbortSignal.timeout(YOUTUBE_TIMEOUT_MS),
    });
    if (videoRes.ok) {
      const videoData = await videoRes.json();
      videoTitle = videoData.items?.[0]?.snippet?.title ?? "";
    }
  } catch {
    // 제목 가져오기 실패 시 빈 문자열 유지
  }

  const result: YouTubeCommentsResponse = {
    comments,
    totalResults: data.pageInfo?.totalResults ?? 0,
    videoId,
    videoTitle,
  };

  return Response.json(result);
}
