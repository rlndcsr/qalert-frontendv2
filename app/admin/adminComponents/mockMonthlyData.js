// Fixed mock queue data for October and November 2025 (weekdays only)
// Only for months 10 and 11 (October and November)

const reasons = [
  "Minor Illness",
  "Injury",
  "First Aid",
  "Health Assessment",
  "Counseling",
  "Emergency",
];

// Helper function to get all weekdays in a month
const getWeekdaysInMonth = (year, month) => {
  const weekdays = [];
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    const dayOfWeek = date.getDay();
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // Include only Monday (1) to Friday (5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      weekdays.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return weekdays;
};

// Generate October 2025 queues (weekdays only)
const octoberWeekdays = getWeekdaysInMonth(2025, 10);
const october2025Queues = Array.from({ length: 89 }, (_, i) => {
  const weekdayIndex = i % octoberWeekdays.length;
  const queueDate = octoberWeekdays[weekdayIndex];
  const dateStr = `2025-10-${String(queueDate.getDate()).padStart(2, "0")}`;
  const queue_number = Math.floor(i / octoberWeekdays.length) + 1;
  const hour = String(8 + (i % 10)).padStart(2, "0"); // Hours 08-17
  const minute = String(10 + (i % 50)).padStart(2, "0");

  return {
    queue_id: 1000 + i,
    user_id: 100 + i,
    date: dateStr,
    queue_number,
    queue_status: i % 10 === 0 ? "cancelled" : "completed",
    reason: reasons[i % reasons.length],
    priority: i % 5 === 0 ? "high" : "normal",
    created_at: `${dateStr} ${hour}:${minute}:00`,
    updated_at: `${dateStr} ${String(9 + (i % 7)).padStart(2, "0")}:${String(
      15 + (i % 40),
    ).padStart(2, "0")}:00`,
  };
});

// Generate November 2025 queues (weekdays only)
const novemberWeekdays = getWeekdaysInMonth(2025, 11);
const november2025Queues = Array.from({ length: 83 }, (_, i) => {
  const weekdayIndex = i % novemberWeekdays.length;
  const queueDate = novemberWeekdays[weekdayIndex];
  const dateStr = `2025-11-${String(queueDate.getDate()).padStart(2, "0")}`;
  const queue_number = Math.floor(i / novemberWeekdays.length) + 1;
  const hour = String(8 + (i % 10)).padStart(2, "0"); // Hours 08-17
  const minute = String(10 + (i % 50)).padStart(2, "0");

  return {
    queue_id: 2000 + i,
    user_id: 200 + i,
    date: dateStr,
    queue_number,
    queue_status: i % 11 === 0 ? "cancelled" : "completed",
    reason: reasons[i % reasons.length],
    priority: i % 6 === 0 ? "high" : "normal",
    created_at: `${dateStr} ${hour}:${minute}:00`,
    updated_at: `${dateStr} ${String(9 + (i % 7)).padStart(2, "0")}:${String(
      15 + (i % 40),
    ).padStart(2, "0")}:00`,
  };
});

// Generate December 2025 queues (weekdays only)
const decemberWeekdays = getWeekdaysInMonth(2025, 12);
const december2025Queues = Array.from({ length: 95 }, (_, i) => {
  const weekdayIndex = i % decemberWeekdays.length;
  const queueDate = decemberWeekdays[weekdayIndex];
  const dateStr = `2025-12-${String(queueDate.getDate()).padStart(2, "0")}`;
  const queue_number = Math.floor(i / decemberWeekdays.length) + 1;
  const hour = String(8 + (i % 10)).padStart(2, "0"); // Hours 08-17
  const minute = String(10 + (i % 50)).padStart(2, "0");

  return {
    queue_id: 3000 + i,
    user_id: 300 + i,
    date: dateStr,
    queue_number,
    queue_status: i % 12 === 0 ? "cancelled" : "completed",
    reason: reasons[i % reasons.length],
    priority: i % 7 === 0 ? "high" : "normal",
    created_at: `${dateStr} ${hour}:${minute}:00`,
    updated_at: `${dateStr} ${String(9 + (i % 7)).padStart(2, "0")}:${String(
      15 + (i % 40),
    ).padStart(2, "0")}:00`,
  };
});

// Generate January 2026 queues (weekdays only)
const januaryWeekdays = getWeekdaysInMonth(2026, 1);
const january2026Queues = Array.from({ length: 78 }, (_, i) => {
  const weekdayIndex = i % januaryWeekdays.length;
  const queueDate = januaryWeekdays[weekdayIndex];
  const dateStr = `2026-01-${String(queueDate.getDate()).padStart(2, "0")}`;
  const queue_number = Math.floor(i / januaryWeekdays.length) + 1;
  const hour = String(8 + (i % 10)).padStart(2, "0"); // Hours 08-17
  const minute = String(10 + (i % 50)).padStart(2, "0");

  return {
    queue_id: 4000 + i,
    user_id: 400 + i,
    date: dateStr,
    queue_number,
    queue_status: i % 9 === 0 ? "cancelled" : "completed",
    reason: reasons[i % reasons.length],
    priority: i % 4 === 0 ? "high" : "normal",
    created_at: `${dateStr} ${hour}:${minute}:00`,
    updated_at: `${dateStr} ${String(9 + (i % 7)).padStart(2, "0")}:${String(
      15 + (i % 40),
    ).padStart(2, "0")}:00`,
  };
});

export const mockMonthlyQueues = {
  10: {
    2025: october2025Queues,
  },
  11: {
    2025: november2025Queues,
  },
  12: {
    2025: december2025Queues,
  },
  1: {
    2026: january2026Queues,
  },
};

// Summary statistics for quick reference
export const mockMonthlySummary = {
  october2025: {
    totalQueues: october2025Queues.length,
    completed: october2025Queues.filter((q) => q.queue_status === "completed")
      .length,
    cancelled: october2025Queues.filter((q) => q.queue_status === "cancelled")
      .length,
    uniquePatients: new Set(october2025Queues.map((q) => q.user_id)).size,
    activeDays: new Set(october2025Queues.map((q) => q.date)).size,
  },
  november2025: {
    totalQueues: november2025Queues.length,
    completed: november2025Queues.filter((q) => q.queue_status === "completed")
      .length,
    cancelled: november2025Queues.filter((q) => q.queue_status === "cancelled")
      .length,
    uniquePatients: new Set(november2025Queues.map((q) => q.user_id)).size,
    activeDays: new Set(november2025Queues.map((q) => q.date)).size,
  },
  december2025: {
    totalQueues: december2025Queues.length,
    completed: december2025Queues.filter((q) => q.queue_status === "completed")
      .length,
    cancelled: december2025Queues.filter((q) => q.queue_status === "cancelled")
      .length,
    uniquePatients: new Set(december2025Queues.map((q) => q.user_id)).size,
    activeDays: new Set(december2025Queues.map((q) => q.date)).size,
  },
  january2026: {
    totalQueues: january2026Queues.length,
    completed: january2026Queues.filter((q) => q.queue_status === "completed")
      .length,
    cancelled: january2026Queues.filter((q) => q.queue_status === "cancelled")
      .length,
    uniquePatients: new Set(january2026Queues.map((q) => q.user_id)).size,
    activeDays: new Set(january2026Queues.map((q) => q.date)).size,
  },
};

export default mockMonthlyQueues;
