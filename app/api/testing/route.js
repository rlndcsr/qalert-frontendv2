import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const data = await req.json();
    const recipient = data?.recipient;
    const message = data?.message;

    if (!recipient || !message) {
      return NextResponse.json(
        { error: "Missing 'recipient' or 'message'" },
        { status: 400 },
      );
    }

    const resp = await fetch("https://smsapiph.onrender.com/api/v1/send/sms", {
      method: "POST",
      headers: {
        "x-api-key":
          process.env.SMSAPIPH_KEY || "sk-2b10fwgftzm5jixo4vfenuujnse1tc8u",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipient, message }),
    });

    const contentType = resp.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await resp.json() : await resp.text();

    if (!resp.ok) {
      return NextResponse.json(
        { error: "SMS API error", details: body },
        { status: resp.status },
      );
    }

    return NextResponse.json({ success: true, result: body });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 },
    );
  }
}
