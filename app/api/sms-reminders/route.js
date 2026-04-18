import { NextResponse } from "next/server";

const BACKEND_API_BASE = process.env.APP_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_BASE_URL ||
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

function normalizePhone(phoneNumber) {
  if (!phoneNumber) return null;
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.startsWith("63")) return `+${digits}`;
  if (digits.startsWith("0")) return `+63${digits.slice(1)}`;
  return `+63${digits}`;
}

async function sendSms(to, text) {
  const params = new URLSearchParams({
    "mocean-from": "QAlert",
    "mocean-to": to,
    "mocean-text": text,
  });

  const resp = await fetch("https://rest.moceanapi.com/rest/2/sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${process.env.MOCEAN_API_KEY}`,
    },
    body: params.toString(),
  });

  const contentType = resp.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await resp.json() : await resp.text();

  if (!resp.ok) {
    throw new Error(`Mocean error: ${JSON.stringify(body)}`);
  }

  return body;
}

function formatTime(timeString) {
  if (!timeString) return "—";
  let hours, minutes;
  if (timeString.includes("T")) {
    const date = new Date(timeString);
    hours = date.getHours();
    minutes = date.getMinutes();
  } else {
    const parts = timeString.split(" ");
    const timePart = parts.length >= 2 ? parts[1] : parts[0];
    const timeParts = timePart.split(":");
    hours = parseInt(timeParts[0], 10);
    minutes = parseInt(timeParts[1], 10);
  }
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = String(minutes).padStart(2, "0");
  return `${hours}:${minutesStr} ${ampm}`;
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    // Fetch queues for today
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayDateStr = `${year}-${month}-${day}`;

    const queuesRes = await fetch(`${BACKEND_API_BASE}/queues`, {
      headers: {
        Accept: "application/json",
        Authorization: token ? `Bearer ${token}` : undefined,
        "ngrok-skip-browser-warning": "true",
      },
    });
    if (!queuesRes.ok) {
      return NextResponse.json({ error: "Failed to fetch queues" }, { status: 502 });
    }
    const queuesData = await queuesRes.json();
    const queues = Array.isArray(queuesData) ? queuesData : queuesData?.data || [];

    // Filter today's active queues (waiting/registered, not cancelled/completed)
    const activeQueues = queues.filter(
      (q) =>
        q.date === todayDateStr &&
        /^(waiting|registered)$/i.test(q.queue_status),
    );

    // Fetch appointments to get appointment times
    const aptsRes = await fetch(`${BACKEND_API_BASE}/appointments`, {
      headers: {
        Accept: "application/json",
        Authorization: token ? `Bearer ${token}` : undefined,
        "ngrok-skip-browser-warning": "true",
      },
    });
    if (!aptsRes.ok) {
      return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 502 });
    }
    const aptsData = await aptsRes.json();
    const appointments = Array.isArray(aptsData) ? aptsData : aptsData?.data || [];
    const appointmentTimeMap = {};
    appointments.forEach((apt) => {
      if (apt.appointment_id && apt.appointment_time) {
        appointmentTimeMap[apt.appointment_id] = apt.appointment_time;
      }
    });

    // Fetch users to get phone numbers
    const usersRes = await fetch(`${BACKEND_API_BASE}/users`, {
      headers: {
        Accept: "application/json",
        Authorization: token ? `Bearer ${token}` : undefined,
        "ngrok-skip-browser-warning": "true",
      },
    });
    if (!usersRes.ok) {
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 502 });
    }
    const usersData = await usersRes.json();
    const users = Array.isArray(usersData) ? usersData : usersData?.data || [];
    const userMap = {};
    users.forEach((u) => {
      if (u.user_id) userMap[u.user_id] = u;
    });

    // Fetch reason categories
    const catsRes = await fetch(`${BACKEND_API_BASE}/reason-categories`, {
      headers: {
        Accept: "application/json",
        Authorization: token ? `Bearer ${token}` : undefined,
        "ngrok-skip-browser-warning": "true",
      },
    });
    const catsData = catsRes.ok ? await catsRes.json() : [];
    const cats = Array.isArray(catsData) ? catsData : catsData?.data || [];
    const reasonCatMap = {};
    cats.forEach((c) => {
      if (c.reason_category_id) reasonCatMap[c.reason_category_id] = c.name;
    });

    const now = new Date();
    const currentHour = now.getHours();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentDay = String(now.getDate()).padStart(2, "2");
    const todayStr = `${currentYear}-${currentMonth}-${currentDay}`;

    const sentKey = `sent-${todayStr}-${String(currentHour).padStart(2, "0")}`;
    const sentEntries = (process.env[sentKey] || "").split(",").filter(Boolean);

    const results = [];
    const sentIds = [];

    for (const queue of activeQueues) {
      if (!queue.appointment_id) continue;
      const aptTime = appointmentTimeMap[queue.appointment_id];
      if (!aptTime) continue;

      let aptHour;
      if (aptTime.includes("T")) {
        aptHour = new Date(aptTime).getHours();
      } else {
        const timePart = aptTime.split(" ")[1] || aptTime;
        aptHour = parseInt(timePart.split(":")[0], 10);
      }

      // Only send to queues whose appointment is within this hour
      if (aptHour !== currentHour) continue;

      // Skip if already sent for this hour
      if (sentEntries.includes(String(queue.queue_entry_id))) continue;

      const patient = userMap[queue.user_id] || {};
      const recipient = normalizePhone(patient.phone_number);
      if (!recipient) {
        results.push({ queue_id: queue.queue_entry_id, status: "skipped", reason: "no phone" });
        continue;
      }

      const sorted = [...activeQueues].sort((a, b) => a.queue_number - b.queue_number);
      const position = sorted.findIndex((q) => q.queue_entry_id === queue.queue_entry_id) + 1;

      const queueNum = String(queue.queue_number).padStart(3, "0");
      const aptTimeFormatted = formatTime(aptTime);
      const reason = queue.reason || reasonCatMap[queue.reason_category_id] || "your appointment";

      const message = `CSU UCHW:\n\nThis is a reminder for your appointment scheduled at ${aptTimeFormatted} (Queue #${queueNum}). ${reason}.\n\nYou are currently #${position} of ${activeQueues.length} patients in queue.\n\nPlease proceed to the university clinic 10 minutes before your scheduled time. Thank you.`;

      try {
        await sendSms(recipient, message);
        results.push({ queue_id: queue.queue_entry_id, status: "sent", recipient });
        sentIds.push(String(queue.queue_entry_id));
        console.log(`[SMS Reminder] Sent to ${recipient} for queue #${queueNum}`);
      } catch (err) {
        results.push({ queue_id: queue.queue_entry_id, status: "failed", error: err.message });
        console.error(`[SMS Reminder] Failed for queue #${queueNum}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      hour: currentHour,
      date: todayStr,
      sentCount: sentIds.length,
      results,
    });
  } catch (err) {
    console.error("[SMS Reminder] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
