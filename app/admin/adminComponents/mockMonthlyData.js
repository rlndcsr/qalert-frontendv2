// Fixed mock queue data for October and November 2025 (around 100 entries per month)
// Only for months 10 and 11 (October and November)

const reasons = [
  "Minor Illness",
  "Injury",
  "First Aid",
  "Health Assessment",
  "Counseling",
  "Emergency",
];

const october2025Queues = Array.from({ length: 89 }, (_, i) => {
  const day = Math.floor(i / 5) + 1; // Max 20 days (0-19)
  const queue_number = (i % 5) + 1;
  return {
    queue_id: 1000 + i,
    user_id: 100 + i,
    date: `2025-10-${String(day).padStart(2, "0")}`,
    queue_number,
    queue_status: i % 10 === 0 ? "cancelled" : "completed",
    reason: reasons[i % reasons.length],
    priority: i % 5 === 0 ? "high" : "normal",
    created_at: `2025-10-${String(day).padStart(2, "0")}
      ${String(8 + (i % 8)).padStart(2, "0")}:${String(10 + (i % 50)).padStart(
      2,
      "0"
    )}:00`,
    updated_at: `2025-10-${String(day).padStart(2, "0")}
      ${String(9 + (i % 7)).padStart(2, "0")}:${String(15 + (i % 40)).padStart(
      2,
      "0"
    )}:00`,
  };
});

const november2025Queues = Array.from({ length: 83 }, (_, i) => {
  const day = Math.floor(i / 5) + 1; // Max 20 days (0-19)
  const queue_number = (i % 5) + 1;
  return {
    queue_id: 2000 + i,
    user_id: 200 + i,
    date: `2025-11-${String(day).padStart(2, "0")}`,
    queue_number,
    queue_status: i % 11 === 0 ? "cancelled" : "completed",
    reason: reasons[i % reasons.length],
    priority: i % 6 === 0 ? "high" : "normal",
    created_at: `2025-11-${String(day).padStart(2, "0")}
      ${String(8 + (i % 8)).padStart(2, "0")}:${String(10 + (i % 50)).padStart(
      2,
      "0"
    )}:00`,
    updated_at: `2025-11-${String(day).padStart(2, "0")}
      ${String(9 + (i % 7)).padStart(2, "0")}:${String(15 + (i % 40)).padStart(
      2,
      "0"
    )}:00`,
  };
});

export const mockMonthlyQueues = {
  10: {
    2025: october2025Queues,
  },
  11: {
    2025: november2025Queues,
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
};

export default mockMonthlyQueues;
