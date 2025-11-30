"use client";

import { motion } from "framer-motion";
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

export default function AnalyticsTab({ stats }) {
  // Static demo datasets (replace with real data later)
  const hourlyQueueData = [
    { hour: "08:00", size: 2, served: 1 },
    { hour: "09:00", size: 5, served: 3 },
    { hour: "10:00", size: 8, served: 5 },
    { hour: "11:00", size: 11, served: 7 },
    { hour: "12:00", size: 9, served: 8 },
    { hour: "13:00", size: 7, served: 9 },
    { hour: "14:00", size: 6, served: 10 },
    { hour: "15:00", size: 4, served: 11 },
  ];

  const reasonDistribution = [
    { reason: "Consultation", value: 40 },
    { reason: "Follow-up", value: 25 },
    { reason: "Lab Results", value: 15 },
    { reason: "Prescription", value: 12 },
    { reason: "Other", value: 8 },
  ];

  const statusMix = [
    { name: "Waiting", value: stats.activeQueue || 10 },
    { name: "Completed", value: stats.completed || 5 },
    { name: "Cancelled", value: 2 },
    { name: "Called", value: 1 },
  ];

  const COLORS = ["#00968a", "#2563eb", "#9333ea", "#f59e0b", "#ef4444"]; // reused palette

  // Derived static KPI examples
  const kpis = [
    {
      label: "Throughput (Served/Hr)",
      value: "11/hr",
      sub: "Peak last hour",
      bg: "from-teal-50 to-teal-100",
      border: "border-teal-200",
      text: "text-teal-700",
    },
    {
      label: "Peak Queue Size",
      value: Math.max(...hourlyQueueData.map((d) => d.size)),
      sub: "Late morning spike",
      bg: "from-indigo-50 to-indigo-100",
      border: "border-indigo-200",
      text: "text-indigo-700",
    },
    {
      label: "Est. Abandon Rate",
      value: "7%",
      sub: "Goal < 10%",
      bg: "from-rose-50 to-rose-100",
      border: "border-rose-200",
      text: "text-rose-700",
    },
    {
      label: "Avg Wait (Static)",
      value: stats.avgWait || "—",
      sub: "Target < 20m",
      bg: "from-amber-50 to-amber-100",
      border: "border-amber-200",
      text: "text-amber-700",
    },
    {
      label: "Patients Today",
      value: stats.todayTotal || 0,
      sub: `${stats.completed || 0} completed`,
      bg: "from-blue-50 to-blue-100",
      border: "border-blue-200",
      text: "text-blue-700",
    },
    {
      label: "Currently Waiting",
      value: stats.activeQueue || 0,
      sub: "Live queue size",
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

      {/* Static Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>
    </motion.div>
  );
}
