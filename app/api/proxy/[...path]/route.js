import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_BACKEND_API_BASE_URL =
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

function normalizeApiBaseUrl(value) {
  const trimmed = (value || DEFAULT_BACKEND_API_BASE_URL).trim();
  const withoutTrailingSlashes = trimmed.replace(/\/+$/, "");

  return withoutTrailingSlashes.endsWith("/api")
    ? withoutTrailingSlashes
    : `${withoutTrailingSlashes}/api`;
}

function getBackendApiBaseUrl() {
  return normalizeApiBaseUrl(
    process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_BASE_URL,
  );
}

function buildUpstreamUrl(request, pathSegments) {
  const requestUrl = new URL(request.url);
  const upstreamPath = Array.isArray(pathSegments) ? pathSegments.join("/") : "";

  return `${getBackendApiBaseUrl()}/${upstreamPath}${requestUrl.search}`;
}

function buildUpstreamHeaders(request) {
  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.set("ngrok-skip-browser-warning", "true");

  return headers;
}

async function forwardRequest(request, context) {
  const params = await context.params;
  const upstreamUrl = buildUpstreamUrl(request, params?.path);
  const method = request.method.toUpperCase();
  const shouldIncludeBody = method !== "GET" && method !== "HEAD";

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers: buildUpstreamHeaders(request),
      body: shouldIncludeBody ? await request.text() : undefined,
      cache: "no-store",
      redirect: "manual",
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.delete("content-encoding");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Proxy request failed",
        details: error instanceof Error ? error.message : String(error),
        upstreamUrl,
      },
      { status: 502 },
    );
  }
}

export async function GET(request, context) {
  return forwardRequest(request, context);
}

export async function POST(request, context) {
  return forwardRequest(request, context);
}

export async function PUT(request, context) {
  return forwardRequest(request, context);
}

export async function PATCH(request, context) {
  return forwardRequest(request, context);
}

export async function DELETE(request, context) {
  return forwardRequest(request, context);
}