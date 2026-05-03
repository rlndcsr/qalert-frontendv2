"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Stethoscope,
  CheckCircle2,
  XCircle,
  CalendarDays,
  AlertCircle,
  ClipboardList,
} from "lucide-react";

const DAY_ABBREV_TO_FULL = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

const getShiftTimeRange = (shift) => {
  if (shift === "AM") return "8:00 AM – 12:00 NN";
  if (shift === "PM") return "1:00 PM – 5:00 PM";
  return shift;
};

const getDateComponents = (dateStr) => {
  if (!dateStr) return { day: "", month: "", year: "", weekday: "" };
  const date = new Date(dateStr);
  return {
    day: date.getDate(),
    month: date.toLocaleDateString("en-US", { month: "short" }),
    year: date.getFullYear(),
    weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
  };
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

const STATUS_CONFIG = {
  confirmed: {
    gradient: "from-[#4ad294] to-[#3bb882]",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: CheckCircle2,
    label: "Confirmed",
    pulse: false,
  },
  scheduled: {
    gradient: "from-[#4ad294] to-[#3bb882]",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: CheckCircle2,
    label: "Confirmed",
    pulse: false,
  },
  pending: {
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: AlertCircle,
    label: "Pending",
    pulse: false,
  },
  completed: {
    gradient: "from-slate-400 to-slate-500",
    bg: "bg-slate-50",
    text: "text-slate-600",
    icon: CheckCircle2,
    label: "Completed",
    pulse: false,
  },
  cancelled: {
    gradient: "from-rose-500 to-red-500",
    bg: "bg-rose-50",
    text: "text-rose-700",
    icon: XCircle,
    label: "Cancelled",
    pulse: false,
  },
  default: {
    gradient: "from-gray-400 to-gray-500",
    bg: "bg-gray-50",
    text: "text-gray-600",
    icon: AlertCircle,
    label: "Unknown",
    pulse: false,
  },
};

const getStatusConfig = (status) => {
  const key = (status || "").toLowerCase();
  return STATUS_CONFIG[key] || STATUS_CONFIG.default;
};

export default function AppointmentCard({
  appointment,
  schedule,
  reasonCategoryName,
  isCancelling,
  onCancel,
  /** When false, hide cancel (e.g. visit finished today but API status still "confirmed"). */
  allowCancel = true,
  /** True when queue/visit is done but appointment row may still say "confirmed". */
  visitCompleted = false,
}) {
  if (!appointment) return null;

  const appointmentStatus =
    appointment.status || appointment.appointment_status || "";
  const statusNorm = (appointmentStatus || "").toLowerCase();
  const statusAllowsCancel =
    statusNorm !== "completed" &&
    statusNorm !== "cancelled" &&
    statusNorm !== "complete";
  const canCancel = allowCancel && statusAllowsCancel;
  const statusConfig = getStatusConfig(
    visitCompleted ? "completed" : appointmentStatus,
  );
  const StatusIcon = statusConfig.icon;
  const fullDay = schedule
    ? DAY_ABBREV_TO_FULL[schedule.day] || schedule.day
    : "";
  const shiftTime = schedule ? getShiftTimeRange(schedule.shift) : "";
  const dateComponents = getDateComponents(appointment.appointment_date);

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div
        className={`bg-gradient-to-r ${statusConfig.gradient} px-6 py-5 relative overflow-hidden`}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white rounded-full" />
          <div className="absolute -right-8 top-8 w-16 h-16 bg-white rounded-full" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
                My Appointment
              </p>
              <h2 className="text-white text-lg font-bold">
                Appointment Details
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {statusConfig.pulse && (
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
                <div className="relative flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <StatusIcon className="w-4 h-4 text-white" />
                  <span className="text-white text-xs font-semibold">
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            )}
            {!statusConfig.pulse && (
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                <StatusIcon className="w-4 h-4 text-white" />
                <span className="text-white text-xs font-semibold">
                  {statusConfig.label}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Doctor Section */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="w-12 h-12 bg-gradient-to-br from-[#4ad294] to-[#3bb882] rounded-xl flex items-center justify-center shadow-md">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              Your Doctor
            </p>
            <p className="text-base font-bold text-gray-900 truncate mt-0.5">
              {schedule?.doctor_name || "Dr. Unknown"}
            </p>
            {schedule && (
              <p className="text-xs text-gray-500 mt-1">
                {fullDay} • {shiftTime}
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-6" />

        {/* Date & Time Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Date Card */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-[#4ad294]" />
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                Date
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {dateComponents.day}
              </span>
              <span className="text-sm font-semibold text-gray-600">
                {dateComponents.month}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{dateComponents.year}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              {dateComponents.weekday}
            </p>
          </div>

          {/* Time Card */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#4ad294]" />
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                Time
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatTime(appointment.appointment_time)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Scheduled</p>
          </div>
        </div>

        {/* Purpose */}
        {reasonCategoryName && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6">
            <div className="w-9 h-9 bg-[#4ad294]/10 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-[#4ad294]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Purpose of Visit
              </p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {reasonCategoryName}
              </p>
            </div>
          </div>
        )}

        {/* Cancel Button */}
        {canCancel && (
          <motion.button
            type="button"
            onClick={() =>
              onCancel(appointment.appointment_id || appointment.id)
            }
            disabled={isCancelling}
            whileHover={isCancelling ? {} : { scale: 1.01 }}
            whileTap={isCancelling ? {} : { scale: 0.99 }}
            className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              isCancelling
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 hover:border-rose-300"
            }`}
          >
            {isCancelling ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span className="hover:cursor-pointer">Cancel Appointment</span>
              </>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
