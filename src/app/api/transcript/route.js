import TranscriptAPI from "youtube-transcript-api";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  try {
    const transcript = await TranscriptAPI.getTranscript(videoId);
    const transcriptText = transcript.map((item) => item.text).join(" ");
    return new Response(JSON.stringify({ transcript: transcriptText }), {
      status: 200,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch transcript" }),
      { status: 500 }
    );
  }
}
