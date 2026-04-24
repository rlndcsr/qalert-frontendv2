"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  RefreshCw,
  Hash,
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
  BellRing,
  Navigation2,
  TriangleAlert,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import {
  getAuthToken,
  getTodayDateString,
  toYMD,
  daysBetween,
} from "../patientUtils";

const API_BASE_URL = "/api/proxy";

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
function UserQueueCard({ userQueue, reasonCategories, aptDoctorMap, doctorNameMap }) {
  const formattedQueueNumber = userQueue.queue_number
    ? String(userQueue.queue_number).padStart(3, "0")
    : "—";

  const getReasonCategoryName = (categoryId) => {
    if (!categoryId || !reasonCategories || reasonCategories.length === 0) {
      return "—";
    }
    const category = reasonCategories.find(
      (cat) => cat.reason_category_id === categoryId,
    );
    return category?.name || "—";
  };

  // Get doctor name from appointment's doctor_id
  const getDoctorName = () => {
    if (!userQueue.appointment_id) return "—";
    const doctorId = aptDoctorMap[String(userQueue.appointment_id)];
    if (!doctorId) return "—";
    return doctorNameMap[doctorId] || "—";
  };

  const status = userQueue.queue_status;
  const isCompleted = status === "completed";
  const isActive =
    status === "waiting" || status === "called" || status === "now_serving";
  const accentColor = isCompleted
    ? "#4ad294"
    : isActive
      ? "#4ad294"
      : "#94a3b8";

  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="relative bg-gradient-to-br from-[#4ad294] to-[#3bb882] rounded-2xl shadow-lg shadow-[#4ad294]/20 overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20" />

        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
                  Queue Entry
                </p>
                <h3 className="text-white text-base font-bold mt-0.5">
                  Appointment Complete
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-semibold">
                Completed
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1">
                Queue Number
              </p>
              <p className="text-2xl font-bold text-white">
                #{formattedQueueNumber}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1">
                Purpose
              </p>
              <p className="text-sm font-semibold text-white truncate mt-1">
                {getReasonCategoryName(userQueue.reason_category_id)}
              </p>
            </div>
          </div>

          {/* Completion Message */}
          <div className="mt-4 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <p className="text-white/90 text-sm font-medium">
              You've completed your appointment. Thank you for visiting!
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

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
            icon={Tag}
            label="Category"
            value={getReasonCategoryName(userQueue.reason_category_id)}
          />
          <QueueInfoItem
            icon={Stethoscope}
            label="Doctor"
            value={getDoctorName()}
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

  // Fetch queues, reason categories, appointments, and doctors in parallel
  const [queueResponse, reasonCategories, appointmentsResponse, doctorsResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/queues`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
    }),
    fetchReasonCategories(),
    fetch(`${API_BASE_URL}/appointments`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
    }),
    fetch(`${API_BASE_URL}/doctors`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
    }),
  ]);

  if (!queueResponse.ok) {
    throw new Error("Failed to fetch queue data");
  }

  // Build doctor name map
  const doctorNameMap = {};
  if (doctorsResponse.ok) {
    const doctorsData = await doctorsResponse.json();
    const doctorsList = Array.isArray(doctorsData)
      ? doctorsData
      : doctorsData?.data || doctorsData?.doctors || [];
    doctorsList.forEach((doc) => {
      if (doc.doctor_id != null) {
        doctorNameMap[String(doc.doctor_id)] = doc.doctor_name || null;
      }
    });
  }

  // Build appointment-to-doctor map
  const aptDoctorMap = {};
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

  return { userQueue, nowServingQueue, reasonCategories, aptDoctorMap, doctorNameMap };
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

// ─── Called Countdown ───────────────────────────────────────────────────────
const COUNTDOWN_DURATION = 10 * 60; // 600 seconds
const RING_RADIUS = 68;
const RING_STROKE = 7;
const RING_SIZE = (RING_RADIUS + RING_STROKE) * 2 + 4;
const RING_CENTER = RING_RADIUS + RING_STROKE + 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function CalledCountdown({ queueEntryId, queueNumber }) {
  const [startTime] = useState(() => {
    if (typeof window === "undefined") return Date.now();
    const key = `called_at_${queueEntryId}`;
    const stored = localStorage.getItem(key);
    if (stored) return parseInt(stored, 10);
    const now = Date.now();
    localStorage.setItem(key, String(now));
    return now;
  });

  const calcRemaining = useCallback(
    () =>
      Math.max(
        0,
        COUNTDOWN_DURATION - Math.floor((Date.now() - startTime) / 1000),
      ),
    [startTime],
  );

  const [secondsLeft, setSecondsLeft] = useState(calcRemaining);
  const [isExpired, setIsExpired] = useState(() => calcRemaining() <= 0);

  useEffect(() => {
    if (isExpired) return;
    const id = setInterval(() => {
      const remaining = calcRemaining();
      setSecondsLeft(remaining);
      if (remaining <= 0) setIsExpired(true);
    }, 1000);
    return () => clearInterval(id);
  }, [calcRemaining, isExpired]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = secondsLeft / COUNTDOWN_DURATION;
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

  const isCritical = secondsLeft <= 60;
  const isUrgent = secondsLeft <= 120;

  const theme = isCritical
    ? {
        header: "from-red-500 to-rose-600",
        ring: "#ef4444",
        track: "#fee2e2",
        bg: "from-red-50/80 to-rose-50/80",
        border: "border-red-200",
        text: "text-red-600",
        subtext: "text-red-400",
        badge: "bg-white/25 text-white border-white/20",
        label: "⚠ Time Almost Up!",
        sublabel:
          "Your slot may be given to the next patient. Hurry to the clinic!",
      }
    : isUrgent
      ? {
          header: "from-amber-500 to-orange-500",
          ring: "#f59e0b",
          track: "#fef3c7",
          bg: "from-amber-50/80 to-orange-50/80",
          border: "border-amber-200",
          text: "text-amber-600",
          subtext: "text-amber-400",
          badge: "bg-white/25 text-white border-white/20",
          label: "Hurry! Head to the clinic now",
          sublabel:
            "Please make your way to the university clinic immediately.",
        }
      : {
          header: "from-blue-500 to-sky-600",
          ring: "#3b82f6",
          track: "#dbeafe",
          bg: "from-blue-50/80 to-sky-50/80",
          border: "border-blue-200",
          text: "text-blue-600",
          subtext: "text-blue-400",
          badge: "bg-white/25 text-white border-white/20",
          label: "Please proceed to the clinic",
          sublabel:
            "You have been called. Make your way to the university clinic.",
        };

  if (isExpired) {
    return (
      <motion.div
        key="expired"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-red-50/60 rounded-2xl border border-red-200 shadow-sm"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-rose-500" />
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center">
            <TriangleAlert className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-1">
              Response Time Expired
            </h3>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Your 10-minute window has passed. Your slot may have been moved to
              the next patient.
            </p>
          </div>
          <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3 text-left">
            <BellRing className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">
              <span className="font-semibold">
                Please contact clinic staff immediately
              </span>{" "}
              at the university health center to check your queue status.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="countdown"
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`relative overflow-hidden bg-gradient-to-br ${theme.bg} rounded-2xl border ${theme.border} shadow-sm`}
    >
      {/* Header */}
      <div
        className={`bg-gradient-to-r ${theme.header} px-5 py-4 flex items-center gap-3`}
      >
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center border border-white/15">
          <BellRing className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/75 text-[11px] font-semibold uppercase tracking-widest leading-none">
            You&apos;ve Been Called
          </p>
          <h3 className="text-white font-bold text-sm mt-0.5 leading-snug">
            Please Proceed to the Clinic
          </h3>
        </div>
        <div
          className={`flex-shrink-0 rounded-xl px-3.5 py-2 border ${theme.badge} backdrop-blur-sm text-center`}
        >
          <p className="text-white/70 text-[10px] leading-none uppercase tracking-wide">
            Queue
          </p>
          <p className="text-xl font-bold text-white leading-tight tracking-tight">
            #{queueNumber}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 flex flex-col items-center gap-4">
        {/* Circular Ring Timer - COMMENTED OUT */}
        {/* <div className="relative">
          {isCritical && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: `${theme.ring}22` }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            style={{ transform: "rotate(-90deg)" }}
          >
            <circle
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={RING_RADIUS}
              fill="none"
              stroke={theme.track}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
            />
            <motion.circle
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={RING_RADIUS}
              fill="none"
              stroke={theme.ring}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 0.5, ease: "linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={secondsLeft}
              className={`text-4xl font-mono font-extrabold tracking-tight ${
                theme.text
              }`}
              animate={isCritical ? { scale: [1, 1.06, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              {String(minutes).padStart(2, "0")}:
              {String(seconds).padStart(2, "0")}
            </motion.span>
            <span className="text-[11px] text-gray-400 font-medium mt-0.5 uppercase tracking-wider">
              remaining
            </span>
          </div>
        </div> */}

        {/* Status message */}
        <div className="text-center">
          <p className={`text-sm font-bold ${theme.text} mb-1`}>
            {theme.label}
          </p>
          <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
            {theme.sublabel}
          </p>
        </div>

        {/* Proceed hint */}
        {/* <div
          className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 border ${
            isCritical
              ? "bg-red-50 border-red-200"
              : isUrgent
                ? "bg-amber-50 border-amber-200"
                : "bg-blue-50 border-blue-200"
          }`}
        >
          <Navigation2 className={`w-4 h-4 flex-shrink-0 ${theme.text}`} />
          <p className={`text-xs font-semibold ${theme.text}`}>
            Head to the CSU University Clinic immediately. You have{" "}
            <strong>
              {minutes > 0
                ? `${minutes} min ${seconds} sec`
                : `${seconds} seconds`}
            </strong>{" "}
            before your slot may be reassigned.
          </p>
        </div> */}
      </div>
    </motion.div>
  );
}

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
  const [aptDoctorMap, setAptDoctorMap] = useState({});
  const [doctorNameMap, setDoctorNameMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cleanup localStorage countdown key when status is no longer "called"
  useEffect(() => {
    if (
      userQueue &&
      userQueue.queue_status !== "called" &&
      userQueue.queue_entry_id
    ) {
      localStorage.removeItem(`called_at_${userQueue.queue_entry_id}`);
    }
  }, [userQueue?.queue_status, userQueue?.queue_entry_id]);

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
      setAptDoctorMap(queueData.aptDoctorMap || {});
      setDoctorNameMap(queueData.doctorNameMap || {});
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

  // SSE: re-fetch queue data in real-time when queue or appointment changes
  useEffect(() => {
    const es = new EventSource("/api/events");

    const handleQueueUpdate = () => {
      console.log("[SSE/AppointmentQueueView] queue-updated → refreshing");
      fetchData();
    };
    const handleAppointmentUpdate = () => {
      console.log(
        "[SSE/AppointmentQueueView] appointment-updated → refreshing",
      );
      fetchData();
    };

    es.addEventListener("queue-updated", handleQueueUpdate);
    es.addEventListener("appointment-updated", handleAppointmentUpdate);
    es.onerror = () =>
      console.warn(
        "[SSE/AppointmentQueueView] connection lost, will reconnect",
      );

    return () => {
      es.removeEventListener("queue-updated", handleQueueUpdate);
      es.removeEventListener("appointment-updated", handleAppointmentUpdate);
      es.close();
    };
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

          {/* Countdown banner when called */}
          <AnimatePresence mode="wait">
            {userQueue.queue_status === "called" && (
              <CalledCountdown
                key={`countdown-${userQueue.queue_entry_id}`}
                queueEntryId={userQueue.queue_entry_id}
                queueNumber={String(userQueue.queue_number).padStart(3, "0")}
              />
            )}
          </AnimatePresence>

          {/* User Queue Card */}
          <UserQueueCard
            userQueue={userQueue}
            reasonCategories={reasonCategories}
            aptDoctorMap={aptDoctorMap}
            doctorNameMap={doctorNameMap}
          />
        </div>
      )}
    </motion.div>
  );
}
