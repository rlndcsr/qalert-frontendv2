"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Calendar, Clock, CheckCircle2, Stethoscope } from "lucide-react";

// Day abbreviation to full name mapping
const DAY_MAP = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
  // Also support full names in case API returns them
  Monday: "Monday",
  Tuesday: "Tuesday",
  Wednesday: "Wednesday",
  Thursday: "Thursday",
  Friday: "Friday",
  Saturday: "Saturday",
  Sunday: "Sunday",
};

// Shift to time range mapping
const SHIFT_MAP = {
  AM: "8:00 AM – 12:00 NN",
  PM: "1:00 PM – 5:00 PM",
};

// Day order for sorting
const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Day abbreviations for compact display
const DAY_ABBREV = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

// Helper function to get full day name
const getFullDayName = (day) => {
  return DAY_MAP[day] || day;
};

// Helper function to get time range from shift
const getTimeRange = (shift) => {
  return SHIFT_MAP[shift] || shift;
};

export default function DoctorCard({ doctor, schedules }) {
  // Format schedules for display
  const formatSchedules = () => {
    if (!schedules || schedules.length === 0) {
      return (
        <div className="flex items-center gap-2 text-gray-400 italic text-sm bg-gray-50 rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4" />
          <span>No schedule available</span>
        </div>
      );
    }

    // Sort by day order
    const sortedSchedules = [...schedules].sort((a, b) => {
      const dayA = getFullDayName(a.day);
      const dayB = getFullDayName(b.day);
      return DAY_ORDER.indexOf(dayA) - DAY_ORDER.indexOf(dayB);
    });

    // Format each schedule with enhanced styling
    return sortedSchedules.map((schedule, index) => {
      const fullDay = getFullDayName(schedule.day);
      const timeRange = getTimeRange(schedule.shift);
      const dayAbbrev = DAY_ABBREV[fullDay] || fullDay;

      return (
        <div
          key={`${schedule.day}-${schedule.shift}`}
          className="group flex items-center gap-3 bg-gradient-to-r from-[#4ad294]/5 to-[#3bb882]/5 hover:from-[#4ad294]/10 hover:to-[#3bb882]/10 rounded-lg px-3 py-2.5 transition-all duration-200"
        >
          {/* Day badge */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-[#4ad294] to-[#3bb882] flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs leading-tight text-center">
              {dayAbbrev}
            </span>
          </div>

          {/* Time info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Clock className="w-3.5 h-3.5 text-[#2fa872] flex-shrink-0" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {schedule.shift} Shift
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-800 truncate">
              {timeRange}
            </p>
          </div>
        </div>
      );
    });
  };

  // Get doctor profile image
  const getAvatarSrc = () => {
    // If doctor has a profile_image, use it
    if (doctor.profile_image) {
      return doctor.profile_image;
    }
    // Default to profile.jpg
    return "/images/profile.jpg";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden hover:shadow-xl hover:border-[#4ad294]/30 transition-all duration-300"
    >
      {/* Decorative gradient header */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-[#4ad294]/10 via-[#3bb882]/10 to-[#2fa872]/10" />

      {/* Medical cross pattern decoration */}
      <div className="absolute top-3 right-3 w-8 h-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <Stethoscope className="w-full h-full text-[#4ad294]" />
      </div>

      {/* Content */}
      <div className="relative p-6">
        {/* Doctor info header */}
        <div className="flex items-start gap-4 mb-6">
          {/* Avatar with medical-themed border */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[#4ad294]/20 to-[#3bb882]/20 p-1 shadow-md ring-2 ring-white group-hover:ring-[#4ad294]/20 transition-all">
              <div className="w-full h-full rounded-xl overflow-hidden bg-white">
                <Image
                  src={getAvatarSrc()}
                  alt={doctor.doctor_name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Verified badge */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-[#4ad294] to-[#3bb882] rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Doctor details */}
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              {doctor.doctor_name}
            </h3>
          </div>
        </div>

        {/* Divider with subtle gradient */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-4" />

        {/* Schedule section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-[#4ad294]" />
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Available Schedule
            </h4>
          </div>

          <div className="space-y-2">{formatSchedules()}</div>
        </div>

        {/* Pulse line decoration at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4ad294] via-[#3bb882] to-[#2fa872] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </motion.div>
  );
}
