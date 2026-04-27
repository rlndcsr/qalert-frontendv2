"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { sileo } from "sileo";
import {
  Search,
  Calendar,
  Clock,
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
  ArrowUpDown,
  Stethoscope,
  Timer,
} from "lucide-react";

// Utility: initials from name
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

const API_BASE_URL = "/api/proxy";

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

// ─── Skeleton loaders ────────────────────────────────────────────────────────
function TableRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      <td className="px-4 py-3.5">
        <div className="w-12 h-6 bg-gray-200 rounded-md" />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 bg-gray-200 rounded w-28" />
            <div className="h-3 bg-gray-200 rounded w-20" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="space-y-1.5">
          <div className="h-3.5 bg-gray-200 rounded w-20" />
          <div className="h-3 bg-gray-200 rounded w-14" />
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="h-6 bg-gray-200 rounded-full w-20" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-3.5 bg-gray-200 rounded w-24" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-3.5 bg-gray-200 rounded w-32" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-3.5 bg-gray-200 rounded w-16" />
      </td>
      <td className="px-4 py-3.5">
        <div className="h-6 w-6 bg-gray-200 rounded-md ml-auto" />
      </td>
    </tr>
  );
}

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

// ─── View Modal ─────────────────────────────────────────────────────────────
function ViewModal({
  queue,
  user,
  reasonCategoryMap,
  onClose,
  aptDoctorMap,
  doctorNameMap,
}) {
  if (!queue) return null;

  const statusConfig = {
    completed: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      label: "Completed",
      icon: CheckCircle,
    },
    cancelled: {
      bg: "bg-red-50",
      text: "text-red-600",
      border: "border-red-200",
      label: "Cancelled",
      icon: XCircle,
    },
    no_show: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      label: "No Show",
      icon: XCircle,
    },
  };

  const statusKey = queue.queue_status?.toLowerCase() || "completed";
  const status = statusConfig[statusKey] || statusConfig.completed;
  const StatusIcon = status.icon;

  // Resolve doctor
  const aptId = queue.appointment_id
    ? aptDoctorMap[String(queue.appointment_id)]
    : null;
  const resolvedDoctorName = aptId ? doctorNameMap[aptId] : null;

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
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#00968a] to-[#11b3a6] px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg font-mono">
                  #{String(queue.queue_number).padStart(3, "0")}
                </span>
              </div>
              <div>
                <h2 className="text-white font-semibold text-base">
                  Queue Details
                </h2>
                <p className="text-white/60 text-xs mt-0.5">
                  {formatDate(queue.date)} at {formatTime(queue.created_at)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Patient info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-[#00968a]/10 flex items-center justify-center">
                <span className="text-sm font-bold text-[#00968a]">
                  {getInitials(user?.name)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.name || "Unknown Patient"}
                </p>
                <p className="text-xs text-gray-400">
                  {user?.phone_number || "No contact"}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.bg} ${status.text} ${status.border}`}
              >
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </span>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#00968a]" />
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Date
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  {formatDate(queue.date)}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#00968a]" />
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Time
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  {formatTime(queue.created_at)}
                </p>
              </div>
              {resolvedDoctorName && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-[#00968a]" />
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      Health Personnel
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">
                    {resolvedDoctorName}
                  </p>
                </div>
              )}
              {queue.session_duration_minutes && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Timer className="w-3.5 h-3.5 text-[#00968a]" />
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      Duration
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">
                    {queue.session_duration_minutes} min
                  </p>
                </div>
              )}
            </div>

            {/* Reason */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="w-3.5 h-3.5 text-[#00968a]" />
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                  Reason
                </p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {reasonCategoryMap?.[queue.reason_category_id] ||
                  queue.reason ||
                  "No reason provided"}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors cursor-pointer text-sm"
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

// ─── Pagination ──────────────────────────────────────────────────────────────
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
    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
      <p className="text-xs text-gray-500">
        <span className="font-semibold text-gray-700">
          {startItem}–{endItem}
        </span>{" "}
        of <span className="font-semibold text-gray-700">{totalItems}</span>{" "}
        records
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QueueHistoryView() {
  const [queues, setQueues] = useState([]);
  const [users, setUsers] = useState([]);
  const [reasonCategories, setReasonCategories] = useState([]);
  const [doctorNameMap, setDoctorNameMap] = useState({});
  const [aptDoctorMap, setAptDoctorMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilterType, setDateFilterType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [viewQueue, setViewQueue] = useState(null);

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

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

      const [
        queuesResponse,
        usersResponse,
        categoriesResponse,
        appointmentsResponse,
        doctorsResponse,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/queues`, { headers }),
        fetch(`${API_BASE_URL}/users`, { headers }),
        fetch(`${API_BASE_URL}/reason-categories`, { headers }),
        fetch(`${API_BASE_URL}/appointments`, { headers }),
        fetch(`${API_BASE_URL}/doctors`, { headers }),
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
          Array.isArray(categoriesData)
            ? categoriesData
            : categoriesData.data || [],
        );
      }

      const docNameMap = {};
      if (doctorsResponse.ok) {
        const docData = await doctorsResponse.json();
        const docList = Array.isArray(docData) ? docData : docData.data || [];
        docList.forEach((doc) => {
          if (doc.doctor_id != null) {
            docNameMap[String(doc.doctor_id)] = doc.doctor_name || null;
          }
        });
        setDoctorNameMap(docNameMap);
      }

      const aptDocMap = {};
      if (appointmentsResponse.ok) {
        const aptData = await appointmentsResponse.json();
        const aptList = Array.isArray(aptData)
          ? aptData
          : aptData.data || aptData.appointments || [];
        aptList.forEach((apt) => {
          if (apt.appointment_id != null && apt.doctor_id != null) {
            aptDocMap[String(apt.appointment_id)] = String(apt.doctor_id);
          }
        });
        setAptDoctorMap(aptDocMap);
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

  const userMap = useMemo(() => {
    const map = {};
    users.forEach((user) => {
      map[user.user_id] = user;
    });
    return map;
  }, [users]);

  const reasonCategoryMap = useMemo(() => {
    const map = {};
    reasonCategories.forEach((cat) => {
      map[cat.reason_category_id] = cat.name;
    });
    return map;
  }, [reasonCategories]);

  const filteredQueues = useMemo(() => {
    let result = queues.filter((q) => {
      const status = q.queue_status?.toLowerCase();
      return (
        status === "completed" || status === "cancelled" || status === "no_show"
      );
    });

    if (statusFilter !== "all") {
      result = result.filter(
        (q) => q.queue_status?.toLowerCase() === statusFilter,
      );
    }

    if (dateFilterType === "today") {
      const today = getTodayString();
      result = result.filter((q) => q.date === today);
    } else if (dateFilterType === "range" && startDate && endDate) {
      result = result.filter((q) => q.date >= startDate && q.date <= endDate);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((q) => {
        const user = userMap[q.user_id];
        const fullName = user?.name?.toLowerCase() || "";
        const queueNum = String(q.queue_number).padStart(3, "0");
        const aptId = q.appointment_id
          ? aptDoctorMap[String(q.appointment_id)]
          : null;
        const docName = aptId ? doctorNameMap[aptId] : "";
        return (
          fullName.includes(query) ||
          queueNum.includes(query) ||
          q.reason?.toLowerCase().includes(query) ||
          docName.toLowerCase().includes(query) ||
          reasonCategoryMap[q.reason_category_id]?.toLowerCase().includes(query)
        );
      });
    }

    return result.sort((a, b) =>
      sortOrder === "desc"
        ? new Date(b.created_at) - new Date(a.created_at)
        : new Date(a.created_at) - new Date(b.created_at),
    );
  }, [
    queues,
    statusFilter,
    dateFilterType,
    startDate,
    endDate,
    searchQuery,
    userMap,
    sortOrder,
    aptDoctorMap,
    doctorNameMap,
    reasonCategoryMap,
  ]);

  const totalPages = Math.ceil(filteredQueues.length / itemsPerPage);
  const paginatedQueues = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQueues.slice(start, start + itemsPerPage);
  }, [filteredQueues, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    statusFilter,
    dateFilterType,
    startDate,
    endDate,
    sortOrder,
  ]);

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFilterType("all");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
  };

  const hasActiveFilters =
    statusFilter !== "all" || dateFilterType !== "all" || searchQuery.trim();

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
  const noShowCount = useMemo(
    () =>
      filteredQueues.filter((q) => q.queue_status?.toLowerCase() === "no_show")
        .length,
    [filteredQueues],
  );

  // Get status config
  const getStatusConfig = (status) => {
    const configs = {
      completed: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
        label: "Completed",
        icon: CheckCircle,
      },
      cancelled: {
        bg: "bg-red-50",
        text: "text-red-600",
        border: "border-red-200",
        dot: "bg-red-400",
        label: "Cancelled",
        icon: XCircle,
      },
      no_show: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-400",
        label: "No Show",
        icon: XCircle,
      },
    };
    return configs[status?.toLowerCase()] || configs.completed;
  };

  const resolveDoctorName = (queue) => {
    const aptId = queue.appointment_id
      ? aptDoctorMap[String(queue.appointment_id)]
      : null;
    return aptId ? doctorNameMap[aptId] : null;
  };

  return (
    <motion.div
      className="max-w-7xl mx-auto space-y-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#00968a] flex items-center justify-center shadow-lg shadow-[#00968a]/20 shrink-0">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              Queue History
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Completed and cancelled visits
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-gray-100 rounded-lg flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            <span className="text-xs font-semibold text-gray-600">
              {filteredQueues.length} total
            </span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 rounded-lg flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700">
              {completedCount} done
            </span>
          </div>
          <div className="px-3 py-1.5 bg-red-50 rounded-lg flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-xs font-semibold text-red-600">
              {cancelledCount} cancelled
            </span>
          </div>
          <div className="px-3 py-1.5 bg-amber-50 rounded-lg flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs font-semibold text-amber-600">
              {noShowCount} no show
            </span>
          </div>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left */}
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-800">Records</h2>
              {!isLoading && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#00968a]/10 text-[#00968a]">
                  {filteredQueues.length}
                </span>
              )}
            </div>

            {/* Right controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status filter */}
              <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5">
                {["all", "completed", "cancelled", "no_show"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer capitalize ${
                      statusFilter === status
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {status === "no_show" ? "no show" : status}
                  </button>
                ))}
              </div>

              {/* Date filter */}
              <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5">
                {[
                  { id: "all", label: "All" },
                  { id: "today", label: "Today" },
                  { id: "range", label: "Range" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setDateFilterType(opt.id);
                      if (opt.id !== "range") {
                        setStartDate("");
                        setEndDate("");
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      dateFilterType === opt.id
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <button
                onClick={() =>
                  setSortOrder((o) => (o === "desc" ? "asc" : "desc"))
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                {sortOrder === "desc" ? "Newest" : "Oldest"}
              </button>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors bg-gray-50 w-40 placeholder:text-gray-400"
                />
              </div>

              {/* Reset */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#00968a] hover:bg-[#00968a]/5 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Date range */}
          {dateFilterType === "range" && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-8 pr-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] bg-gray-50"
                />
              </div>
              <span className="text-gray-300 text-xs">—</span>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="pl-8 pr-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] bg-gray-50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {[
                  { label: "Queue #", sortable: false },
                  { label: "Patient", sortable: false },
                  { label: "Date & Time", sortable: false },
                  { label: "Status", sortable: false },
                  { label: "Health Personnel", sortable: false },
                  { label: "Reason", sortable: false },
                  { label: "Duration", sortable: false },
                  { label: "", sortable: false },
                ].map((col, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 text-left ${i === 0 ? "pl-5" : ""} ${i === 7 ? "pr-5" : ""}`}
                  >
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider leading-none">
                      {col.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))
              ) : paginatedQueues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                        <History className="w-6 h-6 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">
                          No records found
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {hasActiveFilters
                            ? "Try adjusting your filters"
                            : "Records will appear here once created"}
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
                  const statusCfg = getStatusConfig(queue.queue_status);
                  const StatusIcon = statusCfg.icon;
                  const doctorName = resolveDoctorName(queue);

                  return (
                    <tr
                      key={queue.queue_entry_id}
                      className="group hover:bg-[#00968a]/[0.02] transition-colors"
                    >
                      {/* Queue number */}
                      <td className="px-4 py-3.5 pl-5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#00968a]/8 text-[11px] font-bold text-[#00968a] border border-[#00968a]/10 font-mono">
                          #{String(queue.queue_number).padStart(3, "0")}
                        </span>
                      </td>

                      {/* Patient */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#00968a]/10 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-[#00968a]">
                              {getInitials(user?.name)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate max-w-[140px]">
                              {user?.name || "Unknown"}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {user?.phone_number || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-medium text-gray-800">
                          {formatDate(queue.date)}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {formatTime(queue.created_at)}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Doctor */}
                      <td className="px-4 py-3.5">
                        {doctorName ? (
                          <div className="flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5 text-[#00968a] shrink-0" />
                            <span className="text-xs font-medium text-gray-700">
                              {doctorName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-gray-700 font-semibold max-w-[180px] truncate">
                          {reasonCategoryMap[queue.reason_category_id] ||
                            queue.reason ||
                            "—"}
                        </p>
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-medium text-gray700">
                          {queue.session_duration_minutes
                            ? `${queue.session_duration_minutes}m`
                            : "—"}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 pr-5">
                        <button
                          onClick={() => setViewQueue(queue)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:border-[#00968a]/30 hover:bg-[#00968a]/5 text-gray-400 hover:text-[#00968a] transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
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
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <History className="w-6 h-6 text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">
                  No records found
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {hasActiveFilters
                    ? "Try adjusting your filters"
                    : "Records will appear here"}
                </p>
              </div>
            </div>
          ) : (
            paginatedQueues.map((queue) => {
              const user = userMap[queue.user_id];
              const statusCfg = getStatusConfig(queue.queue_status);
              const StatusIcon = statusCfg.icon;
              const doctorName = resolveDoctorName(queue);

              return (
                <div
                  key={queue.queue_entry_id}
                  className="border border-gray-200 rounded-xl overflow-hidden bg-white"
                >
                  <div className="px-4 pt-3.5 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#00968a]/10 flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-[#00968a]">
                          {getInitials(user?.name)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
                          {user?.name || "Unknown"}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          #{String(queue.queue_number).padStart(3, "0")} ·{" "}
                          {formatDate(queue.date)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="px-4 pb-3.5 space-y-1.5">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatTime(queue.created_at)}</span>
                      </div>
                      {doctorName && (
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-[#00968a]" />
                          <span className="text-gray-700 font-medium">
                            {doctorName}
                          </span>
                        </div>
                      )}
                      {queue.session_duration_minutes && (
                        <div className="flex items-center gap-1.5">
                          <Timer className="w-3.5 h-3.5 text-gray-400" />
                          <span>{queue.session_duration_minutes}m</span>
                        </div>
                      )}
                    </div>
                    {(reasonCategoryMap[queue.reason_category_id] ||
                      queue.reason) && (
                      <div className="flex items-start gap-1.5 text-xs text-gray-500">
                        <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-1">
                          {reasonCategoryMap[queue.reason_category_id] ||
                            queue.reason}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => setViewQueue(queue)}
                      className="w-full py-2.5 text-xs font-semibold text-[#00968a] hover:bg-[#00968a]/5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
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
          reasonCategoryMap={reasonCategoryMap}
          aptDoctorMap={aptDoctorMap}
          doctorNameMap={doctorNameMap}
          onClose={() => setViewQueue(null)}
        />
      )}
    </motion.div>
  );
}
