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
  ChevronDown,
  CalendarRange,
} from "lucide-react";
import { getAuthToken } from "../patientUtils";

const API_BASE_URL = "/api/proxy";

// ─── Filter Tabs ────────────────────────────────────────────────────────────
const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

// ─── Date Range Options ─────────────────────────────────────────────────────
const DATE_RANGE_OPTIONS = [
  { id: "all", label: "All Time" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "3months", label: "Last 3 Months" },
  { id: "6months", label: "Last 6 Months" },
  { id: "year", label: "This Year" },
];

// ─── Date Range Filter Component ───────────────────────────────────────────
function DateRangeFilter({ activeRange, onRangeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const activeOption =
    DATE_RANGE_OPTIONS.find((opt) => opt.id === activeRange) ||
    DATE_RANGE_OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200/60 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer shadow-sm"
      >
        <CalendarRange className="w-4 h-4 text-[#4ad294]" />
        <span>{activeOption.label}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200/60 shadow-lg z-50 overflow-hidden"
          >
            {DATE_RANGE_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onRangeChange(option.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-2 transition-colors cursor-pointer ${
                  activeRange === option.id
                    ? "bg-[#4ad294]/10 text-[#4ad294] font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {activeRange === option.id && (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span className={activeRange === option.id ? "ml-0" : "ml-6"}>
                  {option.label}
                </span>
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}

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
  const [queueResponse, reasonCategories, doctors, appointmentsResponse] =
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
      fetch(`${API_BASE_URL}/appointments`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      }),
    ]);

  if (!queueResponse.ok) {
    throw new Error("Failed to fetch queue history");
  }

  // Build doctor name map (doctor_id → doctor_name)
  const doctorNameMap = {};
  doctors.forEach((doc) => {
    if (doc.doctor_id != null) {
      doctorNameMap[String(doc.doctor_id)] = doc.doctor_name || null;
    }
  });

  // Build appointment-to-doctor map (appointment_id → doctor_id)
  let aptDoctorMap = {};
  if (appointmentsResponse.ok) {
    const aptData = await appointmentsResponse.json();
    const aptList = Array.isArray(aptData)
      ? aptData
      : aptData?.data || aptData?.appointments || [];
    aptList.forEach((apt) => {
      if (apt.appointment_id != null && apt.doctor_id != null) {
        aptDoctorMap[String(apt.appointment_id)] = String(apt.doctor_id);
      }
    });
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

  return {
    history: sortedEntries,
    reasonCategories,
    doctorNameMap,
    aptDoctorMap,
  };
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
  const [doctorNameMap, setDoctorNameMap] = useState({});
  const [aptDoctorMap, setAptDoctorMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("all");

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { history, reasonCategories, doctorNameMap, aptDoctorMap } =
        await fetchUserHistory();
      setHistory(history);
      setReasonCategories(reasonCategories);
      setDoctorNameMap(doctorNameMap);
      setAptDoctorMap(aptDoctorMap);
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

    // Filter by date range
    if (dateRange !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const cutoffDays = {
        week: 7,
        month: 30,
        "3months": 90,
        "6months": 180,
        year: 365,
      };
      const days = cutoffDays[dateRange] || 0;
      const cutoffDate = new Date(today);
      cutoffDate.setDate(cutoffDate.getDate() - days);

      entries = entries.filter((entry) => {
        const entryDate = new Date(entry.date || entry.created_at);
        return entryDate >= cutoffDate;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter((entry) => {
        const reason = entry.reason?.toLowerCase() || "";
        const queueNum = String(entry.queue_number || "");
        // Get doctor name via appointment_id → doctor_id → doctor_name
        const aptId = entry.appointment_id
          ? aptDoctorMap[String(entry.appointment_id)]
          : null;
        const docId = aptId ? doctorNameMap[aptId] : null;
        const doctor = docId ? docId.toLowerCase() : "";

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
    dateRange,
    searchQuery,
    doctorNameMap,
    aptDoctorMap,
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

        <div className="flex items-center gap-2">
          {!isLoading && !error && history.length > 0 && (
            <DateRangeFilter
              activeRange={dateRange}
              onRangeChange={setDateRange}
            />
          )}
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
                  {group.entries.map((entry, index) => {
                    // Resolve doctor name via appointment_id → doctor_id
                    const aptId = entry.appointment_id
                      ? aptDoctorMap[String(entry.appointment_id)]
                      : null;
                    const resolvedDoctor = aptId
                      ? doctorNameMap[aptId] || null
                      : null;
                    return (
                      <HistoryCard
                        key={entry.queue_entry_id || `${group.label}-${index}`}
                        entry={entry}
                        index={index}
                        reasonCategories={reasonCategories}
                        doctorName={resolvedDoctor}
                      />
                    );
                  })}
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
