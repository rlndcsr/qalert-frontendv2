"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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
  Filter,
  RotateCcw,
  CheckCircle,
  XCircle,
  Hash,
} from "lucide-react";

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
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-16" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-28" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-24" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-20" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-16" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-20" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-32" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-16" />
      </td>
    </tr>
  );
}

// Card Skeleton for mobile
function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-20 mb-3" />
      <div className="h-5 bg-gray-200 rounded w-32 mb-3" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-4 bg-gray-200 rounded w-28" />
        <div className="h-4 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}

// View Modal Component
function ViewModal({ queue, user, onClose }) {
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
                {queue.reason || "No reason provided"}
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
    <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-sm text-gray-500">
        Showing {startItem} to {endItem} of {totalItems} records
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <span className="hidden sm:inline">Next</span>
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
      toast.error("Authentication required");
      return;
    }

    setIsLoading(true);
    try {
      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": true,
      };

      const [queuesResponse, usersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/queues`, { headers }),
        fetch(`${API_BASE_URL}/users`, { headers }),
      ]);

      if (!queuesResponse.ok || !usersResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const queuesData = await queuesResponse.json();
      const usersData = await usersResponse.json();

      setQueues(Array.isArray(queuesData) ? queuesData : queuesData.data || []);
      setUsers(Array.isArray(usersData) ? usersData : usersData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load queue history");
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
          q.reason?.toLowerCase().includes(query)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00968a]/10 flex items-center justify-center">
            <History className="w-5 h-5 text-[#00968a]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Queue History</h1>
            <p className="text-sm text-gray-500">
              View completed and cancelled queue records
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Queue History List */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        {/* Header with Search and Filters */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Queue Records
            </h2>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or queue #..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors text-sm"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("completed")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
                    statusFilter === "completed"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setStatusFilter("cancelled")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
                    statusFilter === "cancelled"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Cancelled
                </button>
              </div>
            </div>

            {/* Date Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Date:</span>
              <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                <button
                  onClick={() => {
                    setDateFilterType("all");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
                    dateFilterType === "all"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDateFilterType("today")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
                    dateFilterType === "today"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateFilterType("range")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
                    dateFilterType === "range"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Range
                </button>
              </div>

              {/* Date Range Inputs */}
              {dateFilterType === "range" && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors"
                  />
                </div>
              )}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Queue #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))
              ) : paginatedQueues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <History className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">
                        No queue records found
                      </p>
                      <p className="text-gray-400 text-sm">
                        {hasActiveFilters
                          ? "Try adjusting your filters"
                          : "Completed and cancelled queues will appear here"}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="mt-3 text-sm text-[#00968a] hover:text-[#007a70] font-medium cursor-pointer"
                        >
                          Clear all filters
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
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[#00968a]">
                          #{String(queue.queue_number).padStart(3, "0")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {user?.name || "Unknown Patient"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {user?.phone_number || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(queue.date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatTime(queue.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(queue.queue_status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                        {queue.reason || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => setViewQueue(queue)}
                            className="p-2 text-gray-500 hover:text-[#00968a] hover:bg-[#00968a]/10 rounded-lg transition-colors cursor-pointer"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                No queue records found
              </p>
              <p className="text-gray-400 text-sm">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Completed and cancelled queues will appear here"}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-sm text-[#00968a] hover:text-[#007a70] font-medium cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            paginatedQueues.map((queue) => {
              const user = userMap[queue.user_id];
              return (
                <div
                  key={queue.queue_entry_id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#00968a]/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#00968a]">
                          #{String(queue.queue_number).padStart(3, "0")}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {user?.name || "Unknown Patient"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {user?.phone_number || "No phone"}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(queue.queue_status)}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {formatDate(queue.date)} at {formatTime(queue.created_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">
                        {queue.reason || "No reason"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setViewQueue(queue)}
                      className="flex-1 py-2 text-sm font-medium text-[#00968a] hover:bg-[#00968a]/10 rounded-lg transition-colors cursor-pointer"
                    >
                      View Details
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
          onClose={() => setViewQueue(null)}
        />
      )}
    </motion.div>
  );
}
