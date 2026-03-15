"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  RefreshCw,
  Calendar,
  Tag,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
} from "lucide-react";
import { getAuthToken } from "../patientUtils";

const API_BASE_URL = "/api/proxy";

// ─── Filter Tabs ────────────────────────────────────────────────────────────
const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

// ─── Skeleton ───────────────────────────────────────────────────────────────
function HistoryCardSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="relative bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden animate-pulse"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-gray-200 rounded-l-2xl" />
          <div className="pl-5 pr-5 py-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100" />
                <div className="space-y-2">
                  <div className="h-4 w-36 bg-gray-100 rounded" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-6 w-24 bg-gray-100 rounded-full" />
            </div>
            <div className="h-3 w-2/3 bg-gray-50 rounded mb-4" />
            <div className="flex items-center gap-6">
              <div className="h-3 w-28 bg-gray-50 rounded" />
              <div className="h-3 w-20 bg-gray-50 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const config = {
    completed: {
      label: "Completed",
      icon: CheckCircle2,
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
    },
    cancelled: {
      label: "Cancelled",
      icon: XCircle,
      bg: "bg-red-50",
      text: "text-red-600",
      border: "border-red-200",
      dot: "bg-red-400",
    },
  }[status] || {
    label: status || "Unknown",
    icon: Clock,
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    dot: "bg-gray-400",
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold pl-2.5 pr-3 py-1 rounded-full border ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// ─── Date Group Label ───────────────────────────────────────────────────────
function DateGroupLabel({ label }) {
  return (
    <div className="flex items-center gap-3 pt-2 pb-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

// ─── History Card ───────────────────────────────────────────────────────────
function HistoryCard({ entry, reasonCategories, doctorName, index }) {
  const formattedQueueNumber = entry.queue_number
    ? String(entry.queue_number).padStart(3, "0")
    : "—";

  const isCompleted = entry.queue_status === "completed";

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (isNaN(date)) return "—";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date)) return null;
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getReasonCategoryName = (categoryId) => {
    if (!categoryId || !reasonCategories || reasonCategories.length === 0)
      return "General Visit";
    const category = reasonCategories.find(
      (cat) => String(cat.reason_category_id) === String(categoryId),
    );
    return category?.name || category?.category_name || "General Visit";
  };

  const reasonCategoryId =
    entry.reason_category_id || entry.reason_id || entry.category_id;

  const accentColor = isCompleted ? "#4ad294" : "#f87171";
  const accentBg = isCompleted ? "bg-[#4ad294]/8" : "bg-red-400/8";
  const accentText = isCompleted ? "text-[#4ad294]" : "text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      className="group relative bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden hover:shadow-md hover:border-gray-300/60 transition-all duration-300"
    >
      {/* Left accent bar */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-2xl transition-all duration-300 group-hover:w-1.5"
        style={{ backgroundColor: accentColor }}
      />

      <div className="pl-5 pr-5 py-4 sm:py-5">
        {/* Top row: Queue number + category + status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Queue number badge */}
            <div
              className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl ${accentBg} transition-colors duration-200`}
            >
              <span className={`text-sm font-bold ${accentText}`}>
                {formattedQueueNumber}
              </span>
            </div>

            {/* Category + reason */}
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-[#25323A] leading-snug truncate">
                {getReasonCategoryName(reasonCategoryId)}
              </h4>
              {entry.reason && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                  {entry.reason}
                </p>
              )}
            </div>
          </div>

          <StatusBadge status={entry.queue_status} />
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pl-[52px]">
          {doctorName && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Stethoscope className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{doctorName}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>{formatDate(entry.date || entry.created_at)}</span>
          </div>
          {formatTime(entry.updated_at || entry.created_at) && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>{formatTime(entry.updated_at || entry.created_at)}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Service to fetch reason categories
const fetchReasonCategories = async () => {
  const headers = {
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  try {
    const response = await fetch(`${API_BASE_URL}/reason-categories`, {
      headers,
    });

    if (!response.ok) {
      console.warn("Failed to fetch reason categories");
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data?.data || [];
  } catch (err) {
    console.warn("Error fetching reason categories:", err);
    return [];
  }
};

// Service to fetch doctors
const fetchDoctors = async () => {
  const headers = {
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  try {
    const response = await fetch(`${API_BASE_URL}/doctors`, { headers });

    if (!response.ok) {
      console.warn("Failed to fetch doctors");
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data?.data || [];
  } catch (err) {
    console.warn("Error fetching doctors:", err);
    return [];
  }
};

// Service to fetch doctor schedules
const fetchDoctorSchedules = async () => {
  const headers = {
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  try {
    const response = await fetch(`${API_BASE_URL}/doctor-schedule`, {
      headers,
    });

    if (!response.ok) {
      console.warn("Failed to fetch doctor schedules");
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data?.data || [];
  } catch (err) {
    console.warn("Error fetching doctor schedules:", err);
    return [];
  }
};

// Helper function to resolve doctor name from schedule_id
const resolveDoctorName = (scheduleId, doctorSchedules, doctors) => {
  if (!scheduleId || !doctorSchedules || !doctors) return null;

  // Find the doctor-schedule entry that matches this schedule_id
  const doctorSchedule = doctorSchedules.find(
    (ds) => ds.schedule_id === scheduleId,
  );

  if (!doctorSchedule) return null;

  // Find the doctor that matches the doctor_id
  const doctor = doctors.find(
    (doc) => doc.doctor_id === doctorSchedule.doctor_id,
  );

  return doctor?.doctor_name || null;
};

// Service to fetch user's queue history
const fetchUserHistory = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  // Get user data from localStorage
  const userDataStr = localStorage.getItem("userData");
  if (!userDataStr) {
    throw new Error("User data not found");
  }

  const userData = JSON.parse(userDataStr);
  const userId = userData?.id || userData?.user_id || userData?.uid;
  if (!userId) {
    throw new Error("User ID not found");
  }

  // Fetch all required data in parallel
  const [queueResponse, reasonCategories, doctors, doctorSchedules] =
    await Promise.all([
      fetch(`${API_BASE_URL}/queues`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      }),
      fetchReasonCategories(),
      fetchDoctors(),
      fetchDoctorSchedules(),
    ]);

  if (!queueResponse.ok) {
    throw new Error("Failed to fetch queue history");
  }

  const data = await queueResponse.json();
  const list = Array.isArray(data)
    ? data
    : data?.data || data?.queues || data?.items || [];

  // Filter for current user's entries only
  const userEntries = list.filter((q) => {
    const qUserId = q?.user_id ?? q?.user?.id;
    return qUserId == userId;
  });

  // Filter to only show completed or cancelled entries
  const finishedEntries = userEntries.filter((q) => {
    const status = q?.queue_status?.toLowerCase();
    return status === "completed" || status === "cancelled";
  });

  // Sort by date descending (most recent first)
  const sortedEntries = finishedEntries.sort((a, b) => {
    const aDate = a?.date || a?.created_at;
    const bDate = b?.date || b?.created_at;
    const aTime = aDate ? new Date(aDate).getTime() : 0;
    const bTime = bDate ? new Date(bDate).getTime() : 0;
    return bTime - aTime;
  });

  return { history: sortedEntries, reasonCategories, doctors, doctorSchedules };
};

// ─── Date grouping helper ───────────────────────────────────────────────────
function getDateGroup(dateStr) {
  if (!dateStr) return "Unknown";
  const date = new Date(dateStr);
  if (isNaN(date)) return "Unknown";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entryDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "This Week";
  if (diffDays <= 30) return "This Month";
  if (diffDays <= 90) return "Last 3 Months";
  return "Older";
}

export default function MyHistoryView() {
  const [history, setHistory] = useState([]);
  const [reasonCategories, setReasonCategories] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorSchedules, setDoctorSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { history, reasonCategories, doctors, doctorSchedules } =
        await fetchUserHistory();
      setHistory(history);
      setReasonCategories(reasonCategories);
      setDoctors(doctors);
      setDoctorSchedules(doctorSchedules);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError(err.message || "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered + searched entries
  const filteredHistory = useMemo(() => {
    let entries = history;

    // Filter by status
    if (activeFilter !== "all") {
      entries = entries.filter((e) => e.queue_status === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter((entry) => {
        const reason = entry.reason?.toLowerCase() || "";
        const queueNum = String(entry.queue_number || "");
        const doctor =
          resolveDoctorName(
            entry.schedule_id,
            doctorSchedules,
            doctors,
          )?.toLowerCase() || "";

        // Resolve the reason category name from its ID
        const categoryId =
          entry.reason_category_id || entry.reason_id || entry.category_id;
        let categoryName = "";
        if (categoryId && reasonCategories.length > 0) {
          const cat = reasonCategories.find(
            (c) => String(c.reason_category_id) === String(categoryId),
          );
          categoryName = (cat?.name || cat?.category_name || "").toLowerCase();
        }

        return (
          reason.includes(q) ||
          queueNum.includes(q) ||
          doctor.includes(q) ||
          categoryName.includes(q)
        );
      });
    }

    return entries;
  }, [
    history,
    activeFilter,
    searchQuery,
    doctorSchedules,
    doctors,
    reasonCategories,
  ]);

  // Group entries by date
  const groupedHistory = useMemo(() => {
    const groups = [];
    const groupMap = new Map();

    filteredHistory.forEach((entry) => {
      const label = getDateGroup(entry.date || entry.created_at);
      if (!groupMap.has(label)) {
        groupMap.set(label, []);
        groups.push(label);
      }
      groupMap.get(label).push(entry);
    });

    return groups.map((label) => ({ label, entries: groupMap.get(label) }));
  }, [filteredHistory]);

  // Summary stats
  const stats = useMemo(() => {
    const completed = history.filter(
      (e) => e.queue_status === "completed",
    ).length;
    const cancelled = history.filter(
      (e) => e.queue_status === "cancelled",
    ).length;
    return { total: history.length, completed, cancelled };
  }, [history]);

  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#4ad294]/10 flex items-center justify-center">
            <History className="w-5 h-5 text-[#4ad294]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Visit History</h1>
            <p className="text-sm text-gray-500">
              Your completed and cancelled queue records
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
          title="Refresh history"
        >
          <RefreshCw
            className={`w-5 h-5 text-gray-500 ${isLoading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* ─── Stats Summary ───────────────────────────────────────────── */}
      {!isLoading && !error && history.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            {
              label: "Total Visits",
              value: stats.total,
              color: "text-[#25323A]",
              bg: "bg-gray-50",
              border: "border-gray-200/60",
            },
            {
              label: "Completed",
              value: stats.completed,
              color: "text-emerald-700",
              bg: "bg-emerald-50/60",
              border: "border-emerald-200/60",
            },
            {
              label: "Cancelled",
              value: stats.cancelled,
              color: "text-red-600",
              bg: "bg-red-50/60",
              border: "border-red-200/60",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.bg} border ${stat.border} rounded-xl px-4 py-3 text-center`}
            >
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ─── Filters + Search ────────────────────────────────────────── */}
      {!isLoading && !error && history.length > 0 && (
        <div className="mb-5 space-y-3">
          {/* Filter pills */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-1.5 shadow-sm">
            <div className="flex items-center gap-1.5">
              {FILTER_OPTIONS.map((option) => {
                const isActive = activeFilter === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setActiveFilter(option.id)}
                    className={`relative flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-[#4ad294] to-[#3bb882] text-white shadow-sm shadow-[#4ad294]/25"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                    {option.id !== "all" && (
                      <span
                        className={`ml-1.5 text-[10px] font-bold ${
                          isActive ? "text-white/80" : "text-gray-400"
                        }`}
                      >
                        {option.id === "completed"
                          ? stats.completed
                          : stats.cancelled}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reason, queue number, or doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200/60 rounded-xl shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4ad294]/30 focus:border-[#4ad294]/50 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Content ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <HistoryCardSkeleton />
      ) : error ? (
        <div className="bg-white border border-red-200/80 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
            <XCircle className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-[#25323A] mb-1">
            Unable to load history
          </h3>
          <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4ad294] to-[#3bb882] hover:from-[#3bb882] hover:to-[#2fa872] text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm shadow-[#4ad294]/20 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white border border-gray-200/60 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-50 flex items-center justify-center">
            <History className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-[#25323A] mb-1">
            No visit history yet
          </h3>
          <p className="text-sm text-gray-500 max-w-[280px] mx-auto leading-relaxed">
            Once you complete or cancel a queue visit, it will be recorded here.
          </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white border border-gray-200/60 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
            <Search className="w-6 h-6 text-gray-300" />
          </div>
          <h3 className="text-sm font-semibold text-[#25323A] mb-1">
            No matching records
          </h3>
          <p className="text-xs text-gray-500">
            Try adjusting your filters or search terms.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {groupedHistory.map((group) => (
              <div key={group.label}>
                <DateGroupLabel label={group.label} />
                <div className="space-y-2.5 mb-4">
                  {group.entries.map((entry, index) => (
                    <HistoryCard
                      key={entry.queue_entry_id || `${group.label}-${index}`}
                      entry={entry}
                      index={index}
                      reasonCategories={reasonCategories}
                      doctorName={resolveDoctorName(
                        entry.schedule_id,
                        doctorSchedules,
                        doctors,
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
          </AnimatePresence>

          {/* Footer summary */}
          <div className="pt-4 pb-2 text-center">
            <p className="text-xs text-gray-400">
              Showing {filteredHistory.length} of {history.length} visit
              {history.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
