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
          process.env.SMSAPIPH_KEY || "sk-2b10q3dg4sce3xufn1lsmpze2ex5pk4p",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipient, message }),
    });

    const contentType = resp.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const body = isJson ? await resp.json() : await resp.text();

    // Log the full API response so we can see its exact shape
    console.log(
      "[smsapiph] HTTP status:",
      resp.status,
      "| body:",
      JSON.stringify(body),
    );

    if (!resp.ok) {
      return NextResponse.json(
        { error: "SMS API error", details: body },
        { status: resp.status },
      );
    }

    // Some providers return HTTP 200 but with a failed status in the body
    const deliveryStatus =
      body?.status ?? body?.data?.status ?? body?.result?.status ?? "";
    const isDeliveryFailure =
      typeof deliveryStatus === "string" &&
      ["failed", "error", "rejected", "undelivered"].includes(
        deliveryStatus.toLowerCase(),
      );

    if (isDeliveryFailure) {
      return NextResponse.json(
        {
          success: false,
          error: `SMS delivery failed (status: ${deliveryStatus})`,
          result: body,
        },
        { status: 200 },
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
