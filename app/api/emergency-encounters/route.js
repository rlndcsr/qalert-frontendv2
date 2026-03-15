const BACKEND_URL =
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

const commonHeaders = (req) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
  ...(req.headers.get("Authorization") && {
    Authorization: req.headers.get("Authorization"),
  }),
});

export async function GET(req) {
  const upstream = await fetch(`${BACKEND_URL}/emergency-encounters`, {
    method: "GET",
    headers: commonHeaders(req),
    cache: "no-store",
  });

  const data = await upstream.json().catch(() => ({}));
  return Response.json(data, { status: upstream.status });
}

export async function POST(req) {
  const body = await req.json();

  const upstream = await fetch(`${BACKEND_URL}/emergency-encounters`, {
    method: "POST",
    headers: commonHeaders(req),
    body: JSON.stringify(body),
  });

  const data = await upstream.json().catch(() => ({}));
  return Response.json(data, { status: upstream.status });
}
