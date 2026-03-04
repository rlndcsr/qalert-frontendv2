"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  RefreshCw,
  Hash,
  Activity,
  Users,
  Tag,
  ExternalLink,
  CalendarClock,
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import {
  getAuthToken,
  getTodayDateString,
  toYMD,
  daysBetween,
} from "../patientUtils";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_BASE_URL ||
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

// ─── Skeleton ───────────────────────────────────────────────────────────────
function QueueCardSkeleton() {
  return (
    <div className="space-y-3">
      {/* Now Serving Skeleton */}
      <div className="relative bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden animate-pulse">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200" />
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gray-100" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-3 w-36 bg-gray-50 rounded" />
              </div>
            </div>
            <div className="h-12 w-16 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
      {/* User Queue Skeleton */}
      <div className="relative bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden animate-pulse">
        <div className="absolute top-0 left-0 w-1 h-full bg-gray-200" />
        <div className="pl-5 pr-5 py-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-100 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-6 w-20 bg-gray-100 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-[72px] bg-gray-50 rounded-xl" />
            <div className="h-[72px] bg-gray-50 rounded-xl" />
            <div className="h-[72px] bg-gray-50 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const config = {
    now_serving: {
      label: "Now Serving",
      icon: CheckCircle2,
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    called: {
      label: "Called",
      icon: Phone,
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    completed: {
      label: "Completed",
      icon: CheckCircle2,
      bg: "bg-gray-50",
      text: "text-gray-600",
      border: "border-gray-200",
    },
    cancelled: {
      label: "Cancelled",
      icon: XCircle,
      bg: "bg-red-50",
      text: "text-red-600",
      border: "border-red-200",
    },
    waiting: {
      label: "Waiting",
      icon: Clock,
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
    },
  }[status] || {
    label: "Waiting",
    icon: Clock,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
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

// ─── Queue Info Item ────────────────────────────────────────────────────────
function QueueInfoItem({ icon: Icon, label, value, accent = false }) {
  return (
    <div
      className={`rounded-xl border p-3.5 flex items-center gap-3 transition-colors duration-200 ${
        accent
          ? "border-[#4ad294]/25 bg-[#4ad294]/5"
          : "border-gray-100 bg-gray-50/80"
      }`}
    >
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
          accent
            ? "bg-[#4ad294]/15 text-[#4ad294]"
            : "bg-white text-gray-500 border border-gray-100"
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold leading-none">
          {label}
        </p>
        <p className="text-sm font-semibold text-[#25323A] mt-1 break-words leading-snug">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// ─── Now Serving Card ───────────────────────────────────────────────────────
function NowServingCard({ nowServingQueue }) {
  const formattedQueueNumber = nowServingQueue?.queue_number
    ? String(nowServingQueue.queue_number).padStart(3, "0")
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative overflow-hidden bg-gradient-to-br from-[#4ad294] via-[#3fbe8a] to-[#35a87a] rounded-2xl shadow-sm shadow-[#4ad294]/15 p-5"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Now Serving</p>
            <p className="text-xs text-white/65 mt-0.5">
              Current queue number being attended
            </p>
          </div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
          <p className="text-3xl font-bold text-white tracking-tight">
            {formattedQueueNumber}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── No Serving Placeholder ─────────────────────────────────────────────────
function NoServingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden p-5"
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200/80" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Now Serving</p>
            <p className="text-xs text-gray-400 mt-0.5">
              No one is being served yet
            </p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl px-4 py-2 border border-gray-100">
          <p className="text-3xl font-bold text-gray-300 tracking-tight">—</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── User Queue Card ────────────────────────────────────────────────────────
function UserQueueCard({ userQueue, reasonCategories }) {
  const formattedQueueNumber = userQueue.queue_number
    ? String(userQueue.queue_number).padStart(3, "0")
    : "—";

  // Get reason category name from ID
  const getReasonCategoryName = (categoryId) => {
    if (!categoryId || !reasonCategories || reasonCategories.length === 0) {
      return "—";
    }
    const category = reasonCategories.find(
      (cat) => cat.reason_category_id === categoryId,
    );
    return category?.name || "—";
  };

  const status = userQueue.queue_status;
  const isActive =
    status === "waiting" || status === "called" || status === "now_serving";
  const accentColor = isActive ? "#4ad294" : "#94a3b8";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.06, ease: "easeOut" }}
      className="group relative bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden"
    >
      {/* Left accent bar */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
        style={{ backgroundColor: accentColor }}
      />

      <div className="pl-5 pr-5 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4ad294]/8 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-[#4ad294]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#25323A]">
                Your Queue Entry
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Today's appointment
              </p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QueueInfoItem
            icon={Hash}
            label="Queue Number"
            value={formattedQueueNumber}
            accent
          />
          <QueueInfoItem
            icon={Activity}
            label="Status"
            value={
              status === "now_serving"
                ? "Now Serving"
                : status === "called"
                  ? "Called"
                  : status === "completed"
                    ? "Completed"
                    : status === "cancelled"
                      ? "Cancelled"
                      : "Waiting"
            }
          />
          <QueueInfoItem
            icon={Tag}
            label="Category"
            value={getReasonCategoryName(userQueue.reason_category_id)}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Service to fetch reason categories
const fetchReasonCategories = async () => {
  const token = getAuthToken();
  const headers = {
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(`${API_BASE_URL}/reason-categories`, {
    headers,
  });

  if (!response.ok) {
    console.warn("Failed to fetch reason categories");
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data?.data || [];
};

// Service to fetch and filter queue data
const fetchQueueData = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  // Get user data from localStorage (key is "userData")
  const userDataStr = localStorage.getItem("userData");
  if (!userDataStr) {
    throw new Error("User data not found");
  }

  const userData = JSON.parse(userDataStr);
  const userId = userData?.id || userData?.user_id || userData?.uid;
  if (!userId) {
    throw new Error("User ID not found");
  }

  // Fetch queues and reason categories in parallel
  const [queueResponse, reasonCategories] = await Promise.all([
    fetch(`${API_BASE_URL}/queues`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
    }),
    fetchReasonCategories(),
  ]);

  if (!queueResponse.ok) {
    throw new Error("Failed to fetch queue data");
  }

  const data = await queueResponse.json();
  const list = Array.isArray(data)
    ? data
    : data?.data || data?.queues || data?.items || [];

  const today = getTodayDateString();

  // Filter for today's entries only
  const todayEntries = list.filter((q) => {
    const entryDate = toYMD(q?.date ?? q?.created_at);
    if (!entryDate) return false;
    const diff = daysBetween(entryDate, today);
    return diff === 0;
  });

  // Find the "now_serving" queue entry
  const nowServingQueue =
    todayEntries.find((q) => q?.queue_status === "now_serving") || null;

  // Filter for current user's entries today
  const userTodayEntries = todayEntries.filter((q) => {
    const qUserId = q?.user_id ?? q?.user?.id;
    return qUserId == userId;
  });

  // Sort by created_at descending to get most recent first
  const sortedUserEntries = userTodayEntries.sort((a, b) => {
    const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });

  // Get the most recent user entry (prioritize active statuses)
  const activeStatuses = ["waiting", "called", "now_serving"];
  const activeUserEntry = sortedUserEntries.find((q) =>
    activeStatuses.includes(q?.queue_status),
  );
  const userQueue = activeUserEntry || sortedUserEntries[0] || null;

  return { userQueue, nowServingQueue, reasonCategories };
};

// Service to fetch future appointments
const fetchFutureAppointment = async () => {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  // Get user data from localStorage
  const userDataStr = localStorage.getItem("userData");
  if (!userDataStr) {
    return null;
  }

  const userData = JSON.parse(userDataStr);
  const userId = userData?.id || userData?.user_id || userData?.uid;
  if (!userId) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const list = Array.isArray(data)
      ? data
      : data?.data || data?.appointments || data?.items || [];

    const today = getTodayDateString();

    // Filter for user's future appointments (after today, not cancelled)
    const futureAppointments = list.filter((apt) => {
      const aptUserId = apt?.user_id ?? apt?.user?.id;
      if (aptUserId != userId) return false;

      const aptDate = toYMD(apt?.appointment_date);
      if (!aptDate) return false;

      // Check if date is in the future (after today)
      const isFuture = aptDate > today;

      // Check if status is not cancelled
      const status = (apt?.status || "").toLowerCase();
      const isNotCancelled = status !== "cancelled";

      return isFuture && isNotCancelled;
    });

    // Sort by date ascending to get the nearest future appointment
    futureAppointments.sort((a, b) => {
      const aDate = toYMD(a?.appointment_date) || "";
      const bDate = toYMD(b?.appointment_date) || "";
      return aDate.localeCompare(bDate);
    });

    return futureAppointments[0] || null;
  } catch (err) {
    console.error("Error fetching future appointments:", err);
    return null;
  }
};

// Future Appointment Reminder Card component
function FutureAppointmentCard({ appointment }) {
  const appointmentDate = appointment?.appointment_date;
  const appointmentTime = appointment?.appointment_time;

  // Format the date nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format the time nicely
  const formatTime = (timeStr) => {
    if (!timeStr) return "—";
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative bg-white rounded-2xl shadow-sm border border-blue-200/60 overflow-hidden"
    >
      {/* Left accent bar */}
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl bg-blue-500" />

      <div className="pl-5 pr-5 py-5">
        <div className="flex items-start gap-3.5">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
            <CalendarClock className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <h3 className="text-sm font-semibold text-[#25323A]">
                Upcoming Appointment
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5 flex-shrink-0">
                Scheduled
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Don't forget to come on time for your scheduled visit.
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Calendar className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <span className="font-medium">
                  {formatDate(appointmentDate)}
                </span>
              </div>
              {appointmentTime && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span className="font-medium">
                    {formatTime(appointmentTime)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AppointmentQueueView() {
  const [userQueue, setUserQueue] = useState(null);
  const [nowServingQueue, setNowServingQueue] = useState(null);
  const [reasonCategories, setReasonCategories] = useState([]);
  const [futureAppointment, setFutureAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch queue data and future appointments in parallel
      const [queueData, futureApt] = await Promise.all([
        fetchQueueData(),
        fetchFutureAppointment(),
      ]);

      setUserQueue(queueData.userQueue);
      setNowServingQueue(queueData.nowServingQueue);
      setReasonCategories(queueData.reasonCategories);
      setFutureAppointment(futureApt);
    } catch (err) {
      console.error("Error fetching queue data:", err);
      setError(err.message || "Failed to load queue data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <motion.div
      key="queue"
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
            <ClipboardList className="w-5 h-5 text-[#4ad294]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Appointment Queue
            </h1>
            <p className="text-sm text-gray-500">
              Your current queue status for today
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
          title="Refresh queue"
        >
          <RefreshCw
            className={`w-5 h-5 text-gray-500 ${isLoading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* ─── Live Queue Link ─────────────────────────────────────────── */}
      <Link
        href="/queues"
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 mb-5 px-4 py-2.5 bg-white border border-gray-200/60 hover:border-[#4ad294]/40 hover:bg-[#4ad294]/5 text-gray-600 hover:text-[#2a9d6e] font-medium text-xs rounded-xl transition-all duration-200 shadow-sm"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        View Live Queue Display
      </Link>

      {/* ─── Content ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <QueueCardSkeleton />
      ) : error ? (
        <div className="bg-white border border-red-200/80 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-[#25323A] mb-1">
            Unable to load queue
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
      ) : !userQueue ? (
        <div className="space-y-3">
          {/* Future Appointment Reminder */}
          {futureAppointment && (
            <FutureAppointmentCard appointment={futureAppointment} />
          )}

          {/* No Queue Today */}
          <div className="bg-white border border-gray-200/60 rounded-2xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-50 flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-[#25323A] mb-1">
              No active queue today
            </h3>
            <p className="text-sm text-gray-500 max-w-[300px] mx-auto leading-relaxed">
              {futureAppointment
                ? "Your appointment is scheduled for a future date. Come back on the day of your appointment."
                : "You don't have any queue entries for today. Visit the Home page to book an appointment."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Now Serving Card */}
          {nowServingQueue ? (
            <NowServingCard nowServingQueue={nowServingQueue} />
          ) : (
            <NoServingCard />
          )}

          {/* User Queue Card */}
          <UserQueueCard
            userQueue={userQueue}
            reasonCategories={reasonCategories}
          />
        </div>
      )}
    </motion.div>
  );
}
