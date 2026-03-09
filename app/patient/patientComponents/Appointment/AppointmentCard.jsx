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

// Day abbreviation to full name mapping
const DAY_ABBREV_TO_FULL = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

// Get shift time range
const getShiftTimeRange = (shift) => {
  if (shift === "AM") return "8:00 AM – 12:00 NN";
  if (shift === "PM") return "1:00 PM – 5:00 PM";
  return shift;
};

// Format date components
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

// Format time to readable string
const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

// Status configuration
const STATUS_CONFIG = {
  confirmed: {
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    icon: CheckCircle2,
    label: "Confirmed",
  },
  scheduled: {
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    icon: CheckCircle2,
    label: "Confirmed",
  },
  pending: {
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    icon: AlertCircle,
    label: "Pending Confirmation",
  },
  completed: {
    gradient: "from-slate-500 to-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-600",
    icon: CheckCircle2,
    label: "Completed",
  },
  cancelled: {
    gradient: "from-rose-500 to-red-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    icon: XCircle,
    label: "Cancelled",
  },
  default: {
    gradient: "from-gray-500 to-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-600",
    icon: AlertCircle,
    label: "Unknown",
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
}) {
  if (!appointment) return null;

  const appointmentStatus =
    appointment.status || appointment.appointment_status || "";
  const statusConfig = getStatusConfig(appointmentStatus);
  const StatusIcon = statusConfig.icon;
  const fullDay = schedule
    ? DAY_ABBREV_TO_FULL[schedule.day] || schedule.day
    : "";
  const shiftTime = schedule ? getShiftTimeRange(schedule.shift) : "";
  const dateComponents = getDateComponents(appointment.appointment_date);

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Status Header */}
      <div
        className={`bg-gradient-to-r ${statusConfig.gradient} px-6 py-4 relative overflow-hidden`}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white rounded-full" />
          <div className="absolute -right-8 top-8 w-16 h-16 bg-white rounded-full" />
        </div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-xs font-medium uppercase tracking-wide">
                My Appointment
              </p>
              <h2 className="text-white text-lg font-semibold">
                Appointment Details
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
            <StatusIcon className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-xs font-semibold">
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Doctor Section */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center border border-slate-200/60 shadow-sm">
            <Stethoscope className="w-6 h-6 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">
              Your Doctor
            </p>
            <p className="text-base font-semibold text-slate-800 truncate">
              {schedule?.doctor_name || "Dr. Unknown"}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-6" />

        {/* Date & Time Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Date Card */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                Date
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-800">
                {dateComponents.day}
              </span>
              <span className="text-sm font-medium text-slate-500">
                {dateComponents.month}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{dateComponents.year}</p>
          </div>

          {/* Time Card */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                Time
              </span>
            </div>
            <p className="text-xl font-bold text-slate-800">
              {formatTime(appointment.appointment_time)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {dateComponents.weekday}
            </p>
          </div>
        </div>

        {/* Schedule Info */}
        {schedule && (
          <div className="flex items-center gap-3 bg-blue-50/60 rounded-xl px-4 py-3 mb-6 border border-blue-100/60">
            <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-blue-700">
                <span className="font-medium">{fullDay}</span>
                <span className="text-blue-400 mx-2">•</span>
                <span className="text-blue-600">{shiftTime}</span>
              </p>
            </div>
          </div>
        )}

        {/* Purpose / Reason */}
        {reasonCategoryName && (
          <div className="flex items-center gap-3 bg-slate-50/80 rounded-xl px-4 py-3 mb-6 border border-slate-100">
            <ClipboardList className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">
                Purpose of Visit
              </p>
              <p className="text-sm font-medium text-slate-700">
                {reasonCategoryName}
              </p>
            </div>
          </div>
        )}

        {/* Cancel Button */}
        <motion.button
          type="button"
          onClick={() => onCancel(appointment.appointment_id || appointment.id)}
          disabled={isCancelling}
          whileHover={{ scale: isCancelling ? 1 : 1.01 }}
          whileTap={{ scale: isCancelling ? 1 : 0.99 }}
          className={`w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            isCancelling
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/60 hover:border-rose-300"
          }`}
        >
          <XCircle className="w-4.5 h-4.5" />
          <span>Cancel Appointment</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
