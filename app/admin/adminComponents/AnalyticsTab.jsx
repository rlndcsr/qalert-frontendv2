"use client";

import { motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import MonthSelector from "./MonthSelector";

export default function AnalyticsTab({
  stats,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  queues,
  todayDate,
}) {
  // State for reason categories
  const [reasonCategories, setReasonCategories] = useState([]);

  // Fetch reason categories on component mount
  useEffect(() => {
    const fetchReasonCategories = async () => {
      try {
        const response = await fetch(
          "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api/reason-categories"
        );
        if (response.ok) {
          const data = await response.json();
          setReasonCategories(data);
        }
      } catch (error) {
        console.error("Error fetching reason categories:", error);
      }
    };
    fetchReasonCategories();
  }, []);

  // Create a mapping of reason_category_id to category name
  const categoryMap = useMemo(() => {
    const map = {};
    reasonCategories.forEach((cat) => {
      // Try both 'id' and 'reason_category_id' as keys
      map[cat.id] = cat.name;
      map[cat.reason_category_id] = cat.name;
    });
    console.log("Reason categories:", reasonCategories);
    console.log("Category map:", map);
    return map;
  }, [reasonCategories]);

  // Filter queues for the selected month
  const selectedMonthQueues = useMemo(() => {
    if (!queues || queues.length === 0) return [];

    return queues.filter((queue) => {
      if (!queue.date) return false;
      const queueDate = new Date(queue.date);
      const queueMonth = String(queueDate.getMonth() + 1).padStart(2, "0");
      const queueYear = String(queueDate.getFullYear());
      return queueMonth === selectedMonth && queueYear === selectedYear;
    });
  }, [queues, selectedMonth, selectedYear]);

  // Calculate stats for selected month
  const monthlyStats = useMemo(() => {
    const totalQueues = selectedMonthQueues.length;
    const completed = selectedMonthQueues.filter(
      (q) => q.queue_status.toLowerCase() === "completed"
    ).length;
    const cancelled = selectedMonthQueues.filter(
      (q) => q.queue_status.toLowerCase() === "cancelled"
    ).length;
    const activeInMonth = selectedMonthQueues.filter((q) =>
      ["waiting", "called", "now_serving"].includes(
        q.queue_status.toLowerCase()
      )
    ).length;

    return {
      total: totalQueues,
      completed,
      cancelled,
      active: activeInMonth,
    };
  }, [selectedMonthQueues]);

  // Calculate hourly queue data from selected month queues
  const hourlyQueueData = useMemo(() => {
    // Create hourly buckets for 08:00 to 17:00
    const hourlyMap = {};
    for (let h = 8; h <= 17; h++) {
      const hourLabel = `${String(h).padStart(2, "0")}:00`;
      hourlyMap[hourLabel] = { hour: hourLabel, size: 0, served: 0 };
    }

    // Aggregate queue data into hourly buckets
    selectedMonthQueues.forEach((queue) => {
      if (queue.created_at) {
        // Extract hour from timestamp (format: "2025-10-01 HH:MM:SS")
        const timeParts = queue.created_at.split(" ");
        if (timeParts.length >= 2) {
          const hourMin = timeParts[1].substring(0, 5); // Get "HH:MM"
          const hour = hourMin.substring(0, 2); // Get "HH"
          const hourLabel = `${hour}:00`;

          if (hourlyMap[hourLabel]) {
            hourlyMap[hourLabel].size += 1;
            if (queue.queue_status === "completed") {
              hourlyMap[hourLabel].served += 1;
            }
          }
        }
      }
    });

    return Object.values(hourlyMap);
  }, [selectedMonthQueues]);

  // Calculate reason distribution from selected month queues
  const reasonDistribution = useMemo(() => {
    const reasonCounts = {};

    selectedMonthQueues.forEach((queue) => {
      let reasonLabel = "Other";

      // Priority 1: Use reason_category_id with categoryMap (most likely for backend data)
      if (queue.reason_category_id && categoryMap[queue.reason_category_id]) {
        reasonLabel = categoryMap[queue.reason_category_id];
        console.log(
          `Queue ${queue.queue_entry_id}: reason_category_id=${queue.reason_category_id} -> ${reasonLabel}`
        );
      }
      // Priority 2: Check for reason_category object with name
      else if (queue.reason_category && queue.reason_category.name) {
        reasonLabel = queue.reason_category.name;
      }
      // Priority 3: Fall back to reason field (mock data)
      else if (queue.reason) {
        reasonLabel = queue.reason;
      }

      reasonCounts[reasonLabel] = (reasonCounts[reasonLabel] || 0) + 1;
    });

    console.log("Final reason counts:", reasonCounts);
    return Object.entries(reasonCounts)
      .map(([reason, value]) => ({ reason, value }))
      .sort((a, b) => b.value - a.value);
  }, [selectedMonthQueues, categoryMap]); // Calculate status mix from monthly stats
  const statusMix = useMemo(
    () => [
      { name: "Completed", value: monthlyStats.completed },
      { name: "Cancelled", value: monthlyStats.cancelled },
    ],
    [monthlyStats]
  );

  const COLORS = ["#00968a", "#2563eb", "#9333ea", "#f59e0b", "#ef4444"]; // reused palette

  // Calculate unique patients for the month
  const uniquePatients = useMemo(() => {
    return new Set(selectedMonthQueues.map((q) => q.user_id)).size;
  }, [selectedMonthQueues]);

  // Calculate average daily queues
  const avgDailyQueues = useMemo(() => {
    if (monthlyStats.total === 0) return 0;

    // Group queues by date
    const queuesByDate = {};
    selectedMonthQueues.forEach((q) => {
      if (q.date) {
        queuesByDate[q.date] = (queuesByDate[q.date] || 0) + 1;
      }
    });

    const daysWithQueues = Object.keys(queuesByDate).length;
    return daysWithQueues > 0
      ? (monthlyStats.total / daysWithQueues).toFixed(1)
      : 0;
  }, [selectedMonthQueues, monthlyStats.total]);

  // Calculate active days
  const activeDays = useMemo(() => {
    const dates = new Set(selectedMonthQueues.map((q) => q.date));
    return dates.size;
  }, [selectedMonthQueues]);

  // Monthly KPI cards
  const kpis = [
    {
      label: "Total Queues (Month)",
      value: monthlyStats.total,
      sub: `${selectedMonth}/${selectedYear}`,
      bg: "from-teal-50 to-teal-100",
      border: "border-teal-200",
      text: "text-teal-700",
    },
    {
      label: "Completed (Month)",
      value: monthlyStats.completed,
      sub: `${(
        (monthlyStats.completed / (monthlyStats.total || 1)) *
        100
      ).toFixed(0)}% completion rate`,
      bg: "from-indigo-50 to-indigo-100",
      border: "border-indigo-200",
      text: "text-indigo-700",
    },
    {
      label: "Cancelled (Month)",
      value: monthlyStats.cancelled,
      sub: `${(
        (monthlyStats.cancelled / (monthlyStats.total || 1)) *
        100
      ).toFixed(0)}% cancellation rate`,
      bg: "from-rose-50 to-rose-100",
      border: "border-rose-200",
      text: "text-rose-700",
    },
    {
      label: "Unique Patients",
      value: uniquePatients,
      sub: "Different patients served",
      bg: "from-amber-50 to-amber-100",
      border: "border-amber-200",
      text: "text-amber-700",
    },
    {
      label: "Avg Daily Queues",
      value: avgDailyQueues,
      sub: "Average per active day",
      bg: "from-blue-50 to-blue-100",
      border: "border-blue-200",
      text: "text-blue-700",
    },
    {
      label: "Active Days",
      value: activeDays,
      sub: "Days with queue activity",
      bg: "from-purple-50 to-purple-100",
      border: "border-purple-200",
      text: "text-purple-700",
    },
  ];

  return (
    <motion.div
      key="analytics"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Month Selector */}
      <div className="flex justify-between items-center">
        <MonthSelector
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={onMonthChange}
          onYearChange={onYearChange}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={kpi.label + idx}
            className={`p-4 rounded-lg border ${kpi.border} bg-gradient-to-br ${kpi.bg} shadow-sm flex flex-col`}
          >
            <p className={`text-xs font-medium mb-1 ${kpi.text}`}>
              {kpi.label}
            </p>
            <p className={`text-2xl font-bold tracking-tight ${kpi.text}`}>
              {kpi.value}
            </p>
            <p className="text-[11px] text-gray-600 mt-2">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col">
          <h3 className="text-sm font-semibold text-[#25323A] mb-2 flex items-center gap-2">
            <span>Queue Size vs Served (Hourly)</span>
          </h3>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={hourlyQueueData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  cursor={{ stroke: "#00968a", strokeWidth: 1 }}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="size"
                  stroke="#00968a"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Queue Size"
                />
                <Line
                  type="monotone"
                  dataKey="served"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Served"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col">
          <h3 className="text-sm font-semibold text-[#25323A] mb-2 flex items-center gap-2">
            <span>Reasons for Visit</span>
          </h3>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={reasonDistribution}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="reason" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                  {reasonDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col">
          <h3 className="text-sm font-semibold text-[#25323A] mb-2 flex items-center gap-2">
            <span>Status Distribution</span>
          </h3>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusMix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  blendStroke
                >
                  {statusMix.map((entry, index) => (
                    <Cell
                      key={`slice-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Heatmap: Queue Volume by Day + Hour */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-[#25323A] mb-3">
          Queue Volume Heatmap (Day × Hour)
        </h3>
        {(() => {
          // Days of week (weekdays only) and hours
          const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
          const hours = [
            "08",
            "09",
            "10",
            "11",
            "12",
            "13",
            "14",
            "15",
            "16",
            "17",
            "18",
            "19",
          ];

          // Build dynamic matrix from selectedMonthQueues
          const values = days.map((_, di) => hours.map((_, hi) => 0));

          selectedMonthQueues.forEach((queue) => {
            if (queue.created_at && queue.date) {
              try {
                // Parse date to get day of week (0=Sun, 1=Mon, ..., 6=Sat)
                const queueDate = new Date(queue.date);
                const dayOfWeek = queueDate.getDay();
                // Convert to our days array index (0=Mon, ..., 4=Fri) - only weekdays
                const dayIdx = dayOfWeek - 1;

                // Extract hour from timestamp
                const timeParts = queue.created_at.split(" ");
                if (timeParts.length >= 2) {
                  const hour = parseInt(timeParts[1].substring(0, 2), 10);
                  const hourIdx = hour - 8; // 08:00 is index 0

                  // Only count if within weekday range (Mon-Fri) and hour range (08-19)
                  if (
                    hourIdx >= 0 &&
                    hourIdx < hours.length &&
                    dayIdx >= 0 &&
                    dayIdx < days.length
                  ) {
                    values[dayIdx][hourIdx] += 1;
                  }
                }
              } catch (e) {
                // Skip on parsing error
              }
            }
          });

          // Find max value for color scaling
          const maxVal = Math.max(...values.flat().filter((v) => v > 0), 1);

          const colorScale = (v) => {
            // teal scale from light to dark
            const pct = Math.min(1, v / maxVal);
            const start = [240, 253, 250]; // rgb(240,253,250) teal-50
            const end = [0, 150, 138]; // brand teal
            const mix = (a, b) => Math.round(a + (b - a) * pct);
            const r = mix(start[0], end[0]);
            const g = mix(start[1], end[1]);
            const b = mix(start[2], end[2]);
            return `rgb(${r}, ${g}, ${b})`;
          };

          return (
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                {/* Header row */}
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `80px repeat(${hours.length}, minmax(40px, 1fr))`,
                  }}
                >
                  <div className="text-[11px] text-gray-500 py-1"></div>
                  {hours.map((h) => (
                    <div
                      key={`h-${h}`}
                      className="text-[11px] text-gray-500 py-1 text-center"
                    >
                      {h}:00
                    </div>
                  ))}
                </div>
                {/* Day rows */}
                {days.map((day, di) => (
                  <div
                    key={`row-${day}`}
                    className="grid items-center"
                    style={{
                      gridTemplateColumns: `80px repeat(${hours.length}, minmax(40px, 1fr))`,
                    }}
                  >
                    <div className="text-xs text-[#25323A] py-1 pr-2 font-medium">
                      {day}
                    </div>
                    {hours.map((h, hi) => {
                      const val = values[di][hi];
                      return (
                        <div key={`cell-${day}-${h}`} className="p-1">
                          <div
                            className="h-7 rounded"
                            title={`${day} ${h}:00 — Volume: ${val}`}
                            style={{
                              backgroundColor: colorScale(val),
                              border: "1px solid #e5e7eb",
                            }}
                          ></div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {/* Legend */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[11px] text-gray-500">Low</span>
                  <div
                    className="h-3 w-24 rounded"
                    style={{
                      background:
                        "linear-gradient(90deg, rgb(240,253,250), rgb(0,150,138))",
                    }}
                  ></div>
                  <span className="text-[11px] text-gray-500">High</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* SLA Tracking */}
      {/* <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-[#25323A] mb-2">
          SLA Tracking
        </h3>
        <p className="text-xs text-gray-600 mb-3">
          Example: 90% of tickets completed within 10 minutes.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-center p-4">
            <div className="relative w-32 h-32">
              <svg
                viewBox="0 0 36 36"
                className="w-full h-full rotate-[-90deg]"
              >
                <path
                  d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                />
                <path
                  d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                  fill="none"
                  stroke="#00968a"
                  strokeWidth="4"
                  strokeDasharray="90 100"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 rotate-[90deg] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xl font-bold text-[#25323A]">90%</p>
                  <p className="text-[11px] text-gray-600">≤ 10 minutes</p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs text-gray-600 mb-2">
              Completion Time Distribution (static)
            </p>
            <div className="flex items-center gap-1 text-[11px] mb-1">
              <span className="w-16 text-gray-500">0–5m</span>
              <div
                className="h-3 flex-1 rounded bg-teal-200"
                style={{ width: "60%" }}
              ></div>
              <span className="text-gray-700">60%</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] mb-1">
              <span className="w-16 text-gray-500">5–10m</span>
              <div
                className="h-3 flex-1 rounded bg-teal-300"
                style={{ width: "30%" }}
              ></div>
              <span className="text-gray-700">30%</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] mb-1">
              <span className="w-16 text-gray-500">10–20m</span>
              <div
                className="h-3 flex-1 rounded bg-amber-300"
                style={{ width: "8%" }}
              ></div>
              <span className="text-gray-700">8%</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="w-16 text-gray-500">20m+</span>
              <div
                className="h-3 flex-1 rounded bg-rose-300"
                style={{ width: "2%" }}
              ></div>
              <span className="text-gray-700">2%</span>
            </div>
          </div>
        </div>
      </div> */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <h4 className="text-sm font-semibold text-[#25323A] mb-2">
            Operational Insight
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Peak load observed between{" "}
            <span className="font-medium">10:00–11:00</span>. Scheduling
            additional staff during this window could reduce average wait time
            below target threshold. Abandon rate is within acceptable range but
            can improve with proactive status updates via SMS.
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <h4 className="text-sm font-semibold text-[#25323A] mb-2">
            Recommendations
          </h4>
          <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
            <li>Introduce real-time queue position notifications.</li>
            <li>Flag &gt;20m wait cases for manual review.</li>
            <li>Simplify cancellation flow to capture abandonment reason.</li>
            <li>Track repeat visit reasons to drive service improvements.</li>
          </ul>
        </div>
      </div> */}
    </motion.div>
  );
}
