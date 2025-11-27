import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const data = await req.json();
    const from = data?.from || "QAlert";
    const to = data?.to;
    const text = data?.text;

    if (!to || !text) {
      return NextResponse.json(
        { error: "Missing 'to' or 'text'" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      "mocean-from": from,
      "mocean-to": to,
      "mocean-text": text,
    });

    const resp = await fetch("https://rest.moceanapi.com/rest/2/sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Bearer apit-QfLk3ze3I20NLxmrnRUCZwcu7dXs7fhN-kSXbh",
      },
      body: params.toString(),
    });

    const contentType = resp.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await resp.json() : await resp.text();

    if (!resp.ok) {
      return NextResponse.json(
        { error: "Mocean error", details: body },
        { status: resp.status }
      );
    }

    return NextResponse.json({ success: true, result: body });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
