"use client";

import { motion } from "framer-motion";
import Image from "next/image";

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
        <span className="text-gray-400 italic text-sm">
          No schedule available
        </span>
      );
    }

    // Sort by day order
    const sortedSchedules = [...schedules].sort((a, b) => {
      const dayA = getFullDayName(a.day);
      const dayB = getFullDayName(b.day);
      return DAY_ORDER.indexOf(dayA) - DAY_ORDER.indexOf(dayB);
    });

    // Format each schedule as "Day | Time Range"
    return sortedSchedules.map((schedule) => {
      const fullDay = getFullDayName(schedule.day);
      const timeRange = getTimeRange(schedule.shift);

      return (
        <div
          key={`${schedule.day}-${schedule.shift}`}
          className="text-sm text-gray-600"
        >
          <span className="font-medium text-gray-700">{fullDay}</span>
          <span className="mx-2 text-gray-300">|</span>
          <span>{timeRange}</span>
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
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200"
    >
      <div className="flex flex-col items-center text-center">
        {/* Doctor Avatar - Centered at top */}
        <div className="mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-3 border-[#4ad294]/30">
            <Image
              src={getAvatarSrc()}
              alt={`Dr. ${doctor.doctor_name}`}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Doctor Name - Centered below image */}
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Dr. {doctor.doctor_name}
        </h3>

        {/* Schedules - Centered below name */}
        <div className="w-full pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3 font-medium">
            Schedule
          </p>
          <div className="flex flex-col items-center gap-2">
            {formatSchedules()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
