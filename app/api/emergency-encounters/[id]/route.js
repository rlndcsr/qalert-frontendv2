const BACKEND_URL =
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

const commonHeaders = (req) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
  // Forward the Authorization header from the browser request
  ...(req.headers.get("Authorization") && {
    Authorization: req.headers.get("Authorization"),
  }),
});

export async function GET(req, { params }) {
  const { id } = await params;

  const upstream = await fetch(`${BACKEND_URL}/emergency-encounters/${id}`, {
    method: "GET",
    headers: commonHeaders(req),
    cache: "no-store",
  });

  const data = await upstream.json().catch(() => ({}));
  return Response.json(data, { status: upstream.status });
}

export async function PUT(req, { params }) {
  const { id } = await params;
  const body = await req.json();

  const upstream = await fetch(`${BACKEND_URL}/emergency-encounters/${id}`, {
    method: "PUT",
    headers: commonHeaders(req),
    body: JSON.stringify(body),
  });

  const data = await upstream.json().catch(() => ({}));
  return Response.json(data, { status: upstream.status });
}

export async function DELETE(req, { params }) {
  const { id } = await params;

  const upstream = await fetch(`${BACKEND_URL}/emergency-encounters/${id}`, {
    method: "DELETE",
    headers: commonHeaders(req),
  });

  const data = await upstream.json().catch(() => ({}));
  return Response.json(data, { status: upstream.status });
}
