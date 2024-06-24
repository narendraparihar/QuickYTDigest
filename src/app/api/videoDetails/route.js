import axios from "axios";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  try {
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos`,
      {
        params: {
          part: "snippet,contentDetails,statistics",
          id: videoId,
          key: process.env.YOUTUBE_API_KEY,
        },
      }
    );

    if (response.data.items.length === 0) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
      });
    }

    const videoDetails = response.data.items[0];
    return new Response(JSON.stringify(videoDetails), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error }), { status: 500 });
  }
}
