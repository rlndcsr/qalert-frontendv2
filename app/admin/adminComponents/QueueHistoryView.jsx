"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { sileo } from "sileo";
import {
  Search,
  Calendar,
  Clock,
  User,
  Phone,
  FileText,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  History,
  RotateCcw,
  CheckCircle,
  XCircle,
  Hash,
} from "lucide-react";

// Utility: initials from name
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_BASE_URL ||
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

// Utility functions for date/time formatting
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const formatTime = (timeString) => {
  if (!timeString) return "";
  let hours, minutes;
  if (timeString.includes("T")) {
    const date = new Date(timeString);
    hours = date.getHours();
    minutes = date.getMinutes();
  } else {
    const parts = timeString.split(":");
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
  }
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = String(minutes).padStart(2, "0");
  return `${hours}:${minutesStr} ${ampm}`;
};

// Skeleton loader for table rows
function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-5 py-4">
        <div className="w-10 h-6 bg-gray-200 rounded-md" />
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 bg-gray-200 rounded w-28" />
            <div className="h-3 bg-gray-200 rounded w-20" />
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="space-y-1.5">
          <div className="h-3.5 bg-gray-200 rounded w-20" />
          <div className="h-3 bg-gray-200 rounded w-14" />
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="h-5 bg-gray-200 rounded-full w-20" />
      </td>
      <td className="px-5 py-4">
        <div className="h-3.5 bg-gray-200 rounded w-36" />
      </td>
      <td className="px-5 py-4">
        <div className="h-7 bg-gray-200 rounded-lg w-8 ml-auto" />
      </td>
    </tr>
  );
}

// Card Skeleton for mobile
function CardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-gray-200 rounded w-28" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
        <div className="h-5 bg-gray-200 rounded-full w-20" />
      </div>
      <div className="px-4 pb-3 space-y-1.5">
        <div className="h-3 bg-gray-200 rounded w-32" />
        <div className="h-3 bg-gray-200 rounded w-24" />
      </div>
      <div className="h-10 bg-gray-50 border-t border-gray-100" />
    </div>
  );
}

// View Modal Component
function ViewModal({ queue, user, reasonCategoryMap, onClose }) {
  if (!queue) return null;

  const statusConfig = {
    completed: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Completed",
      icon: CheckCircle,
    },
    cancelled: {
      bg: "bg-red-100",
      text: "text-red-800",
      label: "Cancelled",
      icon: XCircle,
    },
  };

  const status =
    statusConfig[queue.queue_status?.toLowerCase()] || statusConfig.completed;
  const StatusIcon = status.icon;

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <motion.div
        key="modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#00968a]" />
              <h2 className="text-lg font-semibold text-gray-900">
                Queue Details
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-130px)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-[#00968a]/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-[#00968a]">
                    #{String(queue.queue_number).padStart(3, "0")}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {user?.name || "Unknown Patient"}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 pt-2">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Patient:</span>
                <span className="text-gray-900 font-medium">
                  {user?.name || "Unknown Patient"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Contact:</span>
                <span className="text-gray-900 font-medium">
                  {user?.phone_number || "—"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Date:</span>
                <span className="text-gray-900 font-medium">
                  {formatDate(queue.date)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Created:</span>
                <span className="text-gray-900 font-medium">
                  {formatTime(queue.created_at)}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  Reason
                </span>
              </div>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {reasonCategoryMap?.[queue.reason_category_id] || queue.reason || "No reason provided"}
              </p>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

// Pagination Component
function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
      <p className="text-xs text-gray-400">
        <span className="font-semibold text-gray-600">
          {startItem}–{endItem}
        </span>{" "}
        of {totalItems} records
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 text-xs font-semibold text-gray-600">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function QueueHistoryView() {
  // Data state
  const [queues, setQueues] = useState([]);
  const [users, setUsers] = useState([]);
  const [reasonCategories, setReasonCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'completed', 'cancelled'
  const [dateFilterType, setDateFilterType] = useState("all"); // 'all', 'today', 'range'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal state
  const [viewQueue, setViewQueue] = useState(null);

  // Get today's date string
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      sileo.error({
        title: "Authentication required",
        description: "Please log in to continue.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": true,
      };

      const [queuesResponse, usersResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/queues`, { headers }),
        fetch(`${API_BASE_URL}/users`, { headers }),
        fetch(`${API_BASE_URL}/reason-categories`, { headers }),
      ]);

      if (!queuesResponse.ok || !usersResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const queuesData = await queuesResponse.json();
      const usersData = await usersResponse.json();

      setQueues(Array.isArray(queuesData) ? queuesData : queuesData.data || []);
      setUsers(Array.isArray(usersData) ? usersData : usersData.data || []);

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setReasonCategories(
          Array.isArray(categoriesData) ? categoriesData : categoriesData.data || [],
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      sileo.error({
        title: "Failed to load history",
        description: "Unable to load queue history. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create user lookup map
  const userMap = useMemo(() => {
    const map = {};
    users.forEach((user) => {
      map[user.user_id] = user;
    });
    return map;
  }, [users]);

  // Create reason category lookup map  (id → name)
  const reasonCategoryMap = useMemo(() => {
    const map = {};
    reasonCategories.forEach((cat) => {
      map[cat.reason_category_id] = cat.name;
    });
    return map;
  }, [reasonCategories]);

  // Filter queues - only completed and cancelled
  const filteredQueues = useMemo(() => {
    let result = queues.filter((q) => {
      const status = q.queue_status?.toLowerCase();
      return status === "completed" || status === "cancelled";
    });

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(
        (q) => q.queue_status?.toLowerCase() === statusFilter,
      );
    }

    // Apply date filter
    if (dateFilterType === "today") {
      const today = getTodayString();
      result = result.filter((q) => q.date === today);
    } else if (dateFilterType === "range" && startDate && endDate) {
      result = result.filter((q) => q.date >= startDate && q.date <= endDate);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((q) => {
        const user = userMap[q.user_id];
        const fullName = user?.name?.toLowerCase() || "";
        const queueNum = String(q.queue_number).padStart(3, "0");
        return (
          fullName.includes(query) ||
          queueNum.includes(query) ||
          q.reason?.toLowerCase().includes(query) ||
          reasonCategoryMap[q.reason_category_id]?.toLowerCase().includes(query)
        );
      });
    }

    // Sort by date descending (newest first)
    return result.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
  }, [
    queues,
    statusFilter,
    dateFilterType,
    startDate,
    endDate,
    searchQuery,
    userMap,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredQueues.length / itemsPerPage);
  const paginatedQueues = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQueues.slice(start, start + itemsPerPage);
  }, [filteredQueues, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilterType, startDate, endDate]);

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter("all");
    setDateFilterType("all");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
  };

  // Check if any filter is active
  const hasActiveFilters =
    statusFilter !== "all" || dateFilterType !== "all" || searchQuery.trim();

  // Stat counts
  const completedCount = useMemo(
    () =>
      filteredQueues.filter(
        (q) => q.queue_status?.toLowerCase() === "completed",
      ).length,
    [filteredQueues],
  );
  const cancelledCount = useMemo(
    () =>
      filteredQueues.filter(
        (q) => q.queue_status?.toLowerCase() === "cancelled",
      ).length,
    [filteredQueues],
  );

  // Get status badge
  const getStatusBadge = (status) => {
    const config = {
      completed: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Completed",
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Cancelled",
      },
    };
    const s = config[status?.toLowerCase()] || config.completed;
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}
      >
        {s.label}
      </span>
    );
  };

  return (
    <motion.div
      className="max-w-7xl mx-auto space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#00968a] flex items-center justify-center shadow-md shadow-[#00968a]/20 shrink-0">
            <History className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Queue History
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              View completed and cancelled queue records
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-xs font-medium text-gray-600">
                  {filteredQueues.length} records
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-green-700">
                  {completedCount} completed
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-xs font-medium text-red-700">
                  {cancelledCount} cancelled
                </span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Queue History List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: title + count */}
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
                All Records
              </h2>
              {!isLoading && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  {filteredQueues.length}
                </span>
              )}
            </div>

            {/* Right: filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status tabs */}
              <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("completed")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    statusFilter === "completed"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setStatusFilter("cancelled")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    statusFilter === "cancelled"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Cancelled
                </button>
              </div>

              {/* Date tabs */}
              <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
                <button
                  onClick={() => {
                    setDateFilterType("all");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    dateFilterType === "all"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  All Dates
                </button>
                <button
                  onClick={() => setDateFilterType("today")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    dateFilterType === "today"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateFilterType("range")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    dateFilterType === "range"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  Range
                </button>
              </div>

              {/* Date range pickers */}
              {dateFilterType === "range" && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="pl-7 pr-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors bg-gray-50"
                    />
                  </div>
                  <span className="text-gray-300 text-xs font-medium">—</span>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="pl-7 pr-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors bg-gray-50"
                    />
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patient or queue #..."
                  className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors text-xs bg-gray-50 w-52"
                />
              </div>

              {/* Reset */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Clear filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Queue #
                  </span>
                </th>
                <th className="px-5 py-3.5 text-left">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Patient
                  </span>
                </th>
                <th className="px-5 py-3.5 text-left">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Date &amp; Time
                  </span>
                </th>
                <th className="px-5 py-3.5 text-left">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Status
                  </span>
                </th>
                <th className="px-5 py-3.5 text-left">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Reason
                  </span>
                </th>
                <th className="px-5 py-3.5 text-right">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))
              ) : paginatedQueues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <History className="w-7 h-7 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">
                          No records found
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {hasActiveFilters
                            ? "Try adjusting your filters"
                            : "Completed and cancelled queues will appear here"}
                        </p>
                      </div>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-xs font-semibold text-[#00968a] hover:text-[#007a70] cursor-pointer"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedQueues.map((queue) => {
                  const user = userMap[queue.user_id];
                  return (
                    <tr
                      key={queue.queue_entry_id}
                      className="group hover:bg-gray-50/70 transition-colors"
                    >
                      {/* Queue number */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#00968a]/8 text-[#00968a] text-xs font-bold font-mono border border-[#00968a]/15">
                          #{String(queue.queue_number).padStart(3, "0")}
                        </span>
                      </td>
                      {/* Patient */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#00968a]/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-[#00968a]">
                              {getInitials(user?.name)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {user?.name || "Unknown Patient"}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {user?.phone_number || "No contact"}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Date & Time */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-800">
                          {formatDate(queue.date)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatTime(queue.created_at)}
                        </p>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-4">
                        {getStatusBadge(queue.queue_status)}
                      </td>
                      {/* Reason */}
                      <td className="px-5 py-4 max-w-[220px]">
                        <p className="text-sm text-gray-600 line-clamp-2 leading-snug">
                          {reasonCategoryMap[queue.reason_category_id] || queue.reason || "\u2014"}
                        </p>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end">
                          <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setViewQueue(queue)}
                              className="p-2 text-gray-500 hover:text-[#00968a] hover:bg-[#00968a]/5 transition-colors cursor-pointer"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
          ) : paginatedQueues.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <History className="w-7 h-7 text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">
                  No records found
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {hasActiveFilters
                    ? "Try adjusting your filters"
                    : "Completed and cancelled queues will appear here"}
                </p>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-semibold text-[#00968a] cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            paginatedQueues.map((queue) => {
              const user = userMap[queue.user_id];
              return (
                <div
                  key={queue.queue_entry_id}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                    <div className="w-10 h-10 rounded-full bg-[#00968a]/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-[#00968a]">
                        {getInitials(user?.name)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {user?.name || "Unknown Patient"}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {user?.phone_number || "No contact"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {getStatusBadge(queue.queue_status)}
                      <span className="text-[10px] font-bold text-[#00968a] font-mono">
                        #{String(queue.queue_number).padStart(3, "0")}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 pb-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formatDate(queue.date)}</span>
                      <Clock className="w-3.5 h-3.5 text-gray-400 ml-1" />
                      <span>{formatTime(queue.created_at)}</span>
                    </div>
                    {(reasonCategoryMap[queue.reason_category_id] || queue.reason) && (
                      <div className="flex items-start gap-2 text-xs text-gray-500">
                        <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                        <p className="line-clamp-2">{reasonCategoryMap[queue.reason_category_id] || queue.reason}</p>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => setViewQueue(queue)}
                      className="w-full py-2.5 text-xs font-semibold text-[#00968a] hover:bg-[#00968a]/5 transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!isLoading && filteredQueues.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredQueues.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* View Modal */}
      {viewQueue && (
        <ViewModal
          queue={viewQueue}
          user={userMap[viewQueue.user_id]}
          reasonCategoryMap={reasonCategoryMap}
          onClose={() => setViewQueue(null)}
        />
      )}
    </motion.div>
  );
}
