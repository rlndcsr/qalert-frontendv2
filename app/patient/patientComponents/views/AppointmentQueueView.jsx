"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  RefreshCw,
  Hash,
  FileText,
  Activity,
  Users,
  Tag,
  ExternalLink,
  CalendarClock,
  Calendar,
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

// Skeleton card component for loading state
function QueueCardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Now Serving Skeleton */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-12 w-20 bg-gray-200 rounded-lg" />
        </div>
      </div>
      {/* User Queue Skeleton */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 animate-pulse">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-40 bg-gray-200 rounded" />
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="h-20 bg-gray-200 rounded-lg" />
            <div className="h-20 bg-gray-200 rounded-lg" />
            <div className="h-20 bg-gray-200 rounded-lg" />
            <div className="h-20 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Status badge component
function StatusBadge({ status }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case "now_serving":
        return {
          label: "Now Serving",
          className: "bg-green-100 text-green-700",
        };
      case "called":
        return { label: "Called", className: "bg-blue-100 text-blue-700" };
      case "completed":
        return {
          label: "Completed",
          className: "bg-gray-100 text-gray-700 border border-gray-300",
        };
      case "cancelled":
        return { label: "Cancelled", className: "bg-red-100 text-red-700" };
      case "waiting":
      default:
        return { label: "Waiting", className: "bg-amber-100 text-amber-700" };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full ${config.className}`}
    >
      {config.label}
    </span>
  );
}

// Queue info item component
function QueueInfoItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-[#4ad294]/30 bg-[#f5fdf8] p-4 flex items-start gap-3">
      <div className="mt-0.5 w-10 h-10 bg-[#4ad294] text-white rounded-full flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
          {label}
        </p>
        <p className="text-sm font-semibold text-[#25323A] mt-1 break-words">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// Now Serving Card component
function NowServingCard({ nowServingQueue }) {
  const formattedQueueNumber = nowServingQueue?.queue_number
    ? String(nowServingQueue.queue_number).padStart(3, "0")
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-gradient-to-r from-[#4ad294] to-[#3bc285] rounded-2xl shadow-md p-6 text-white"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">Now Serving</p>
            <p className="text-xs text-white/60 mt-0.5">Current queue number</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold">{formattedQueueNumber}</p>
        </div>
      </div>
    </motion.div>
  );
}

// User Queue Card component
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      className="bg-white rounded-2xl shadow-md border border-gray-100 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-gray-900">
          Your Queue Entry
        </h3>
        <StatusBadge status={userQueue.queue_status} />
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QueueInfoItem
          icon={Hash}
          label="Your Queue Number"
          value={formattedQueueNumber}
        />
        <QueueInfoItem
          icon={Activity}
          label="Status"
          value={
            userQueue.queue_status === "now_serving"
              ? "Now Serving"
              : userQueue.queue_status === "called"
                ? "Called"
                : userQueue.queue_status === "completed"
                  ? "Completed"
                  : userQueue.queue_status === "cancelled"
                    ? "Cancelled"
                    : "Waiting"
          }
        />
        <QueueInfoItem
          icon={Tag}
          label="Reason"
          value={getReasonCategoryName(userQueue.reason_category_id)}
        />
        {/* <QueueInfoItem
          icon={FileText}
          label="Description"
          value={userQueue.reason}
        /> */}
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <CalendarClock className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-1">
            Upcoming Appointment
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            You have a scheduled appointment. Don't forget to come on time!
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-blue-800">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{formatDate(appointmentDate)}</span>
            </div>
            {appointmentTime && (
              <div className="flex items-center gap-2 text-blue-800">
                <CalendarClock className="w-4 h-4" />
                <span className="font-medium">
                  {formatTime(appointmentTime)}
                </span>
              </div>
            )}
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Header */}
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
              View your current queue status
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
          title="Refresh"
        >
          <RefreshCw
            className={`w-5 h-5 text-gray-500 ${
              isLoading ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>

      {/* View Live Queue Link */}
      <Link
        href="/queues"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mb-6 px-4 py-2.5 bg-[#4ad294]/10 hover:bg-[#4ad294]/20 text-[#2a9d6e] font-medium text-sm rounded-lg transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        View Live Queue Display
      </Link>

      {/* Content */}
      {isLoading ? (
        <QueueCardSkeleton />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-medium mb-2">Error loading queue</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : !userQueue ? (
        <div className="space-y-4">
          {/* Future Appointment Reminder */}
          {futureAppointment && (
            <FutureAppointmentCard appointment={futureAppointment} />
          )}

          {/* No Queue Today Message */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Active Queue Today
            </h3>
            <p className="text-gray-500 text-sm">
              {futureAppointment
                ? "Your appointment is scheduled for a future date. Come back on the day of your appointment."
                : "You don't have any queue entries for today. Visit the Home page to book an appointment."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Now Serving Card */}
          {nowServingQueue ? (
            <NowServingCard nowServingQueue={nowServingQueue} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-gray-100 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Now Serving
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      No one is being served yet
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-gray-300">—</p>
                </div>
              </div>
            </motion.div>
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
