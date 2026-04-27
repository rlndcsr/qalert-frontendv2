"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Calendar, Clock, CheckCircle2, Stethoscope } from "lucide-react";

const DAY_MAP = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
  Monday: "Monday",
  Tuesday: "Tuesday",
  Wednesday: "Wednesday",
  Thursday: "Thursday",
  Friday: "Friday",
  Saturday: "Saturday",
  Sunday: "Sunday",
};

const SHIFT_MAP = {
  AM: "8:00 AM – 12:00 NN",
  PM: "1:00 PM – 5:00 PM",
};

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DAY_ABBREV = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

const getFullDayName = (day) => DAY_MAP[day] || day;
const getTimeRange = (shift) => SHIFT_MAP[shift] || shift;

export default function DoctorCard({ doctor, schedules }) {
  const formatSchedules = () => {
    if (!schedules || schedules.length === 0) {
      return (
        <div className="flex items-center gap-2 text-gray-400 italic text-sm bg-gray-50 rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4" />
          <span>No schedule available</span>
        </div>
      );
    }

    const sortedSchedules = [...schedules].sort((a, b) => {
      const dayA = getFullDayName(a.day);
      const dayB = getFullDayName(b.day);
      return DAY_ORDER.indexOf(dayA) - DAY_ORDER.indexOf(dayB);
    });

    return sortedSchedules.map((schedule) => {
      const fullDay = getFullDayName(schedule.day);
      const timeRange = getTimeRange(schedule.shift);
      const dayAbbrev = DAY_ABBREV[fullDay] || fullDay;

      return (
        <div
          key={`${schedule.day}-${schedule.shift}`}
          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100"
        >
          <div className="w-10 h-10 rounded-lg bg-[#4ad294]/10 flex items-center justify-center">
            <span className="text-xs font-semibold text-[#4ad294]">
              {dayAbbrev}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {schedule.shift} Shift
            </p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {timeRange}
            </p>
          </div>
        </div>
      );
    });
  };

  const getAvatarSrc = () => {
    if (doctor.profile_image) return doctor.profile_image;
    return "/images/profile.jpg";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden hover:shadow-xl hover:border-[#4ad294]/20 transition-all duration-300"
    >
      <div className="p-4 sm:p-5">
        {/* Doctor Info Header */}
        <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-100">
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 shadow-sm">
              <Image
                src={getAvatarSrc()}
                alt={doctor.doctor_name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#4ad294] rounded-full flex items-center justify-center border-2 border-white">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight truncate">
              {doctor.doctor_name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Stethoscope className="w-3.5 h-3.5 text-[#4ad294]" />
              <span className="text-xs text-gray-500">Health Personnel</span>
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div>
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Available Schedule
            </h4>
          </div>
          <div className="space-y-2">{formatSchedules()}</div>
        </div>
      </div>
    </motion.div>
  );
}
