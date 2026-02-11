"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, User, CheckCircle, X } from "lucide-react";
import { ClipLoader } from "react-spinners";

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

// Format date to readable string (e.g., "February 15, 2026")
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Format time to readable string (e.g., "10:00 AM")
const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

// Get status badge styling
const getStatusBadge = (status) => {
  const statusLower = (status || "").toLowerCase();
  switch (statusLower) {
    case "confirmed":
    case "scheduled":
      return {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Confirmed",
      };
    case "pending":
      return {
        bg: "bg-amber-100",
        text: "text-amber-700",
        label: "Pending",
      };
    case "completed":
      return {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Completed",
      };
    case "cancelled":
      return {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Cancelled",
      };
    default:
      return {
        bg: "bg-gray-100",
        text: "text-gray-700",
        label: status || "Unknown",
      };
  }
};

export default function AppointmentCard({
  appointment,
  schedule,
  isCancelling,
  onCancel,
}) {
  if (!appointment) return null;

  const statusBadge = getStatusBadge(appointment.status);
  const fullDay = schedule
    ? DAY_ABBREV_TO_FULL[schedule.day] || schedule.day
    : "";
  const shiftTime = schedule ? getShiftTimeRange(schedule.shift) : "";

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 max-w-lg mx-auto"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Header with Icon */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#D4F4E6] rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-[#4ad294]" />
        </div>
        <h2 className="text-xl font-semibold text-[#25323A] mb-2">
          Appointment Confirmed
        </h2>
      </div>

      {/* Appointment Details */}
      <div className="space-y-4 mb-6">
        {/* Doctor */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-[#4ad294]/10 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-[#4ad294]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Doctor</p>
            <p className="text-sm font-medium text-[#25323A]">
              {schedule?.doctor_name || "Dr. Unknown"}
            </p>
          </div>
        </div>

        {/* Schedule */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-[#4ad294]/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-[#4ad294]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Schedule</p>
            <p className="text-sm font-medium text-[#25323A]">
              {fullDay} | {shiftTime}
            </p>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-[#4ad294]/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-[#4ad294]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Date</p>
            <p className="text-sm font-medium text-[#25323A]">
              {formatDate(appointment.appointment_date)}
            </p>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-[#4ad294]/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-[#4ad294]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Time</p>
            <p className="text-sm font-medium text-[#25323A]">
              {formatTime(appointment.appointment_time)}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-center pt-2">
          <span
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}
          >
            <CheckCircle className="w-4 h-4" />
            Status: {statusBadge.label}
          </span>
        </div>
      </div>

      {/* Cancel Button */}
      <button
        type="button"
        onClick={() => onCancel(appointment.appointment_id || appointment.id)}
        disabled={isCancelling}
        className={`w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-md shadow-sm transition-all duration-200 font-medium ${
          isCancelling
            ? "opacity-70 cursor-not-allowed"
            : "cursor-pointer hover:shadow-md"
        }`}
      >
        {isCancelling ? (
          <>
            <ClipLoader size={18} color="#ffffff" />
            <span>Cancelling...</span>
          </>
        ) : (
          <>
            <X className="w-5 h-5" />
            <span>Cancel Appointment</span>
          </>
        )}
      </button>
    </motion.div>
  );
}
