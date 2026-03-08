export async function GET() {
  const upstream = await fetch(
    "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api/events",
    {
      headers: {
        Accept: "text/event-stream",
        "ngrok-skip-browser-warning": "true",
        "Cache-Control": "no-cache",
      },
      // Required to stream the response body
      duplex: "half",
    },
  );

  if (!upstream.ok) {
    return new Response("Failed to connect to SSE upstream", {
      status: upstream.status,
    });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
