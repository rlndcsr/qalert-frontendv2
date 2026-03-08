"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Phone,
  CreditCard,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Hash,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_BASE_URL ||
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_CONFIG = {
  completed: {
    label: "Completed",
    className: "bg-green-50 text-green-700 border border-green-200",
    icon: CheckCircle2,
    iconClass: "text-green-500",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-600 border border-red-200",
    icon: XCircle,
    iconClass: "text-red-400",
  },
  called: {
    label: "Called",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
    icon: Activity,
    iconClass: "text-blue-500",
  },
  now_serving: {
    label: "Now Serving",
    className: "bg-teal-50 text-teal-700 border border-teal-200",
    icon: Activity,
    iconClass: "text-teal-500",
  },
  waiting: {
    label: "Waiting",
    className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    icon: Clock,
    iconClass: "text-yellow-500",
  },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status?.toLowerCase()] ?? {
    label: status ?? "Unknown",
    className: "bg-gray-100 text-gray-600 border border-gray-200",
    icon: AlertCircle,
    iconClass: "text-gray-400",
  };
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${config.className}`}
    >
      <Icon className={`w-3 h-3 ${config.iconClass}`} />
      {config.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border ${accent ?? "border-gray-100 bg-gray-50"}`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accent ? "bg-white/60" : "bg-white"}`}
      >
        <Icon className="w-[18px] h-[18px] text-[#00968a]" />
      </div>
      <div>
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      </div>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <tbody className="divide-y divide-gray-50">
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-5 py-4">
            <div className="h-4 bg-gray-100 rounded w-12" />
          </td>
          <td className="px-5 py-4">
            <div className="h-4 bg-gray-100 rounded w-24" />
          </td>
          <td className="px-5 py-4">
            <div className="h-4 bg-gray-100 rounded w-48" />
          </td>
          <td className="px-5 py-4">
            <div className="h-6 bg-gray-100 rounded-full w-20" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

const ITEMS_PER_PAGE = 8;

export default function UserDetailView({ patient, onBack }) {
  const [queueHistory, setQueueHistory] = useState([]);
  const [reasonCategories, setReasonCategories] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!patient) return;
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const token = localStorage.getItem("adminToken");
        const headers = {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        };
        const [queuesRes, categoriesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/queues`, { headers }),
          fetch(`${API_BASE_URL}/reason-categories`, { headers }),
        ]);
        if (!queuesRes.ok) throw new Error("Failed to fetch queue history");
        const data = await queuesRes.json();
        const userQueues = data
          .filter((q) => q.user_id === patient.user_id)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setQueueHistory(userQueues);
        if (categoriesRes.ok) {
          const cats = await categoriesRes.json();
          setReasonCategories(Array.isArray(cats) ? cats : []);
        }
      } catch (err) {
        console.error("Error fetching queue history:", err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [patient]);

  const reasonCategoryMap = useMemo(() => {
    const map = {};
    reasonCategories.forEach((cat) => {
      map[cat.reason_category_id] = cat.name;
    });
    return map;
  }, [reasonCategories]);

  const stats = useMemo(() => {
    const total = queueHistory.length;
    const completed = queueHistory.filter(
      (q) => q.queue_status?.toLowerCase() === "completed",
    ).length;
    const cancelled = queueHistory.filter(
      (q) => q.queue_status?.toLowerCase() === "cancelled",
    ).length;
    const active = queueHistory.filter((q) =>
      ["waiting", "called", "now_serving"].includes(
        q.queue_status?.toLowerCase(),
      ),
    ).length;
    return { total, completed, cancelled, active };
  }, [queueHistory]);

  const filteredHistory = useMemo(() => {
    if (statusFilter === "all") return queueHistory;
    return queueHistory.filter(
      (q) => q.queue_status?.toLowerCase() === statusFilter,
    );
  }, [queueHistory, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredHistory.length / ITEMS_PER_PAGE),
  );
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  if (!patient) return null;

  const infoFields = [
    {
      icon: Mail,
      label: "Email Address",
      value: patient.email_address || "—",
    },
    {
      icon: Phone,
      label: "Contact Number",
      value: patient.phone_number || "—",
    },
    { icon: CreditCard, label: "ID Number", value: patient.id_number || "—" },
    {
      icon: User,
      label: "Gender",
      value: patient.gender
        ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)
        : "—",
    },
  ];

  return (
    <motion.div
      key="user-detail"
      className="max-w-7xl mx-auto"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25 }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#00968a] transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Users
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-gray-800">
          {patient.name}
        </span>
      </div>

      {/* Profile Header Card */}
      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        {/* Accent bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00968a] via-[#11b3a6] to-[#00968a]" />
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00968a]/20 to-[#00968a]/5 border border-[#00968a]/20 flex items-center justify-center shrink-0">
            <span className="text-2xl font-extrabold text-[#00968a]">
              {getInitials(patient.name)}
            </span>
          </div>

          {/* Name & badges */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">
              {patient.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700 border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Active
              </span>
              {patient.gender && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                    patient.gender?.toLowerCase() === "female"
                      ? "bg-pink-50 text-pink-600 border border-pink-200"
                      : "bg-blue-50 text-blue-600 border border-blue-200"
                  }`}
                >
                  {patient.gender}
                </span>
              )}
            </div>
          </div>

          {/* Right: ID Number highlight */}
          {patient.id_number && (
            <div className="shrink-0 text-right">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                ID Number
              </p>
              <p className="text-base font-bold font-mono text-gray-800">
                {patient.id_number}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Body: two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-5">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Contact Information
              </h3>
            </div>
            <div className="px-5 py-4 space-y-4">
              {infoFields.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      {label}
                    </p>
                    <p className="text-sm font-medium text-gray-800 break-all mt-0.5">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visit Statistics */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Visit Statistics
              </h3>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-3">
              <StatCard
                icon={Hash}
                label="Total Visits"
                value={isLoadingHistory ? "—" : stats.total}
              />
              <StatCard
                icon={CheckCircle2}
                label="Completed"
                value={isLoadingHistory ? "—" : stats.completed}
              />
              <StatCard
                icon={XCircle}
                label="Cancelled"
                value={isLoadingHistory ? "—" : stats.cancelled}
              />
              <StatCard
                icon={Activity}
                label="Active"
                value={isLoadingHistory ? "—" : stats.active}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Queue History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header + filter */}
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-[18px] h-[18px] text-[#00968a]" />
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Queue History
                </h3>
                {!isLoadingHistory && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                    {filteredHistory.length}
                  </span>
                )}
              </div>
              {/* Status filter pills */}
              <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5 flex-wrap">
                {["all", "completed", "cancelled"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer capitalize ${
                      statusFilter === s
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {s === "all"
                      ? "All"
                      : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-3 text-left">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Queue #
                      </span>
                    </th>
                    <th className="px-5 py-3 text-left">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Date
                      </span>
                    </th>
                    <th className="px-5 py-3 text-left">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Reason / Purpose
                      </span>
                    </th>
                    <th className="px-5 py-3 text-right">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Status
                      </span>
                    </th>
                  </tr>
                </thead>
                {isLoadingHistory ? (
                  <HistorySkeleton />
                ) : filteredHistory.length === 0 ? (
                  <tbody>
                    <tr>
                      <td colSpan={4} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                            <CalendarDays className="w-7 h-7 text-gray-300" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-500">
                              No records found
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {statusFilter !== "all"
                                ? "Try a different status filter"
                                : "This patient has no queue history yet"}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody className="divide-y divide-gray-50">
                    {paginated.map((entry, idx) => (
                      <motion.tr
                        key={entry.queue_entry_id}
                        className="hover:bg-slate-50/70 transition-colors"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: idx * 0.03 }}
                      >
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-bold font-mono text-[#00968a]">
                            #{String(entry.queue_number).padStart(3, "0")}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-gray-700">
                            {formatDate(entry.date)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 max-w-xs">
                          <span className="text-sm text-gray-600 line-clamp-1">
                            {reasonCategoryMap[entry.reason_category_id] ||
                              entry.reason || (
                                <span className="text-gray-400 italic">
                                  No reason provided
                                </span>
                              )}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <StatusBadge status={entry.queue_status} />
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>

            {/* Pagination */}
            {!isLoadingHistory && filteredHistory.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  <span className="font-semibold text-gray-600">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredHistory.length,
                    )}
                  </span>{" "}
                  of {filteredHistory.length} records
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-xs font-semibold text-gray-600">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
