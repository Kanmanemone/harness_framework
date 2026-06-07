export async function GET(): Promise<Response> {
  return Response.json({
    youtube: !!process.env.YOUTUBE_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
  });
}
