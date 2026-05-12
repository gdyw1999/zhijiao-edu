import { NextRequest } from "next/server";

const BACKEND_STREAM_URL = "http://127.0.0.1:8000/api/chat/generate/stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const bodyText = await request.text();

  const upstream = await fetch(BACKEND_STREAM_URL, {
    method: "POST",
    headers: {
      "Content-Type": request.headers.get("content-type") || "application/json",
    },
    body: bodyText,
    cache: "no-store",
  });

  if (!upstream.ok) {
    const errorText = await upstream.text();
    return new Response(errorText || "stream proxy error", {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "text/plain; charset=utf-8",
      },
    });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

