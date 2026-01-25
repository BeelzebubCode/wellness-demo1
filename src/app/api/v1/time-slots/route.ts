import { NextRequest, NextResponse } from "next/server";

async function forward(req: NextRequest, method: string) {
  const url = new URL(req.url);
  const target = new URL("/api/v2/time-slots", url.origin);

  // forward query string ทั้งหมด (date, action, etc.)
  url.searchParams.forEach((v, k) => target.searchParams.set(k, v));

  const body =
    method === "GET" || method === "DELETE"
      ? undefined
      : await req.text().catch(() => undefined);

  const res = await fetch(target.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      cookie: req.headers.get("cookie") ?? "",
    },
    body,
    cache: "no-store",
  });

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req: NextRequest) {
  return forward(req, "GET");
}
export async function POST(req: NextRequest) {
  return forward(req, "POST");
}
export async function DELETE(req: NextRequest) {
  return forward(req, "DELETE");
}
export async function PATCH(req: NextRequest) {
  return forward(req, "PATCH");
}
