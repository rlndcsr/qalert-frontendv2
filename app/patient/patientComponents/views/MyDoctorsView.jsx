"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Stethoscope, RefreshCw, Calendar } from "lucide-react";
import DoctorCard from "../DoctorCard";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_BASE_URL ||
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

// Filter options configuration
const FILTER_OPTIONS = [
  { id: "all", label: "All Doctors" },
  { id: "Monday", label: "Monday" },
  { id: "Tuesday", label: "Tuesday" },
  { id: "Wednesday", label: "Wednesday" },
  { id: "Thursday", label: "Thursday" },
  { id: "Friday", label: "Friday" },
];

// Day abbreviation to full name mapping for schedule matching
const DAY_ABBREV_TO_FULL = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

// Skeleton card component for loading state
function DoctorCardSkeleton() {
  return (
    <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
      {/* Decorative gradient header */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-[#4ad294]/10 via-[#3bb882]/10 to-[#2fa872]/10" />

      <div className="relative p-6 animate-pulse">
        {/* Doctor info header */}
        <div className="flex items-start gap-4 mb-6">
          {/* Avatar skeleton */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gray-200" />
          </div>

          {/* Doctor details skeleton */}
          <div className="flex-1 pt-1 space-y-2">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="h-6 w-40 bg-gray-200 rounded-full" />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mb-4" />

        {/* Schedule section skeleton */}
        <div>
          <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
          <div className="space-y-2">
            <div className="h-14 bg-gray-100 rounded-lg" />
            <div className="h-14 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Filter pills component
function DayFilter({ activeFilter, onFilterChange }) {
  return (
    <div className="mb-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onFilterChange(option.id)}
              className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                activeFilter === option.id
                  ? "bg-gradient-to-r from-[#4ad294] to-[#3bb882] text-white shadow-lg shadow-[#4ad294]/30 scale-105"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800 hover:scale-102"
              }`}
            >
              {activeFilter === option.id && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 bg-gradient-to-r from-[#4ad294] to-[#3bb882] rounded-xl"
                  style={{ zIndex: -1 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MyDoctorsView() {
  const [doctors, setDoctors] = useState([]);
  const [doctorSchedules, setDoctorSchedules] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchDoctorsData = async () => {
    setIsLoading(true);
    setError(null);

    const headers = {
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
    };

    try {
      // Fetch all three APIs in parallel
      const [doctorsRes, doctorSchedulesRes, schedulesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/doctors`, { headers }),
        fetch(`${API_BASE_URL}/doctor-schedule`, { headers }),
        fetch(`${API_BASE_URL}/schedules`, { headers }),
      ]);

      if (!doctorsRes.ok) {
        throw new Error("Failed to fetch doctors");
      }

      // Handle doctor-schedule API - try alternative endpoint if primary fails
      let doctorSchedulesData;
      if (!doctorSchedulesRes.ok) {
        // Try alternative endpoint name (doctor_schedules with underscore)
        const altResponse = await fetch(`${API_BASE_URL}/doctor_schedules`, {
          headers,
        });
        if (!altResponse.ok) {
          throw new Error("Failed to fetch doctor schedules");
        }
        doctorSchedulesData = await altResponse.json();
      } else {
        doctorSchedulesData = await doctorSchedulesRes.json();
      }

      if (!schedulesRes.ok) {
        throw new Error("Failed to fetch schedules");
      }

      const [doctorsData, schedulesData] = await Promise.all([
        doctorsRes.json(),
        schedulesRes.json(),
      ]);

      setDoctors(doctorsData);
      setDoctorSchedules(doctorSchedulesData);
      setSchedules(schedulesData);
    } catch (err) {
      console.error("Error fetching doctors data:", err);
      setError(err.message || "Failed to load doctors data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorsData();
  }, []);

  // Compose doctor data with their schedules
  const getDoctorWithSchedules = (doctor) => {
    // Find all doctor_schedule entries for this doctor
    const doctorScheduleEntries = doctorSchedules.filter(
      (ds) => ds.doctor_id === doctor.doctor_id,
    );

    // Map to actual schedule details
    const doctorScheduleDetails = doctorScheduleEntries
      .map((ds) => {
        const schedule = schedules.find(
          (s) => s.schedule_id === ds.schedule_id,
        );
        return schedule;
      })
      .filter(Boolean); // Remove any null/undefined entries

    return doctorScheduleDetails;
  };

  // Get all active doctors
  const activeDoctors = useMemo(() => {
    return doctors.filter((doctor) => doctor.is_active);
  }, [doctors]);

  // Check if a doctor has a schedule on a specific day
  const doctorHasScheduleOnDay = (doctor, dayFilter) => {
    // Find all doctor_schedule entries for this doctor
    const doctorScheduleEntries = doctorSchedules.filter(
      (ds) => ds.doctor_id === doctor.doctor_id,
    );

    // Check if any of those schedules match the selected day
    return doctorScheduleEntries.some((ds) => {
      const schedule = schedules.find((s) => s.schedule_id === ds.schedule_id);
      if (!schedule) return false;

      // Handle both abbreviated (Mon, Tue) and full (Monday, Tuesday) day names
      const scheduleDay = schedule.day;
      const fullDayName = DAY_ABBREV_TO_FULL[scheduleDay] || scheduleDay;

      return fullDayName === dayFilter;
    });
  };

  // Filter doctors based on active filter
  const filteredDoctors = useMemo(() => {
    if (activeFilter === "all") {
      return activeDoctors;
    }

    return activeDoctors.filter((doctor) =>
      doctorHasScheduleOnDay(doctor, activeFilter),
    );
  }, [activeDoctors, activeFilter, doctorSchedules, schedules]);

  return (
    <motion.div
      key="doctors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#4ad294]/10 to-[#3bb882]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#3bb882]/10 to-[#2fa872]/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4ad294] to-[#3bb882] flex items-center justify-center shadow-lg shadow-[#4ad294]/30">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                My Doctors
              </h1>
              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#4ad294] rounded-full animate-pulse"></span>
                View available doctors and their schedules
              </p>
            </div>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchDoctorsData}
            disabled={isLoading}
            className="group p-3 rounded-xl bg-gray-50 hover:bg-gradient-to-br hover:from-[#4ad294]/10 hover:to-[#3bb882]/10 border border-gray-200 hover:border-[#4ad294]/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh"
          >
            <RefreshCw
              className={`w-5 h-5 text-gray-600 group-hover:text-[#4ad294] transition-colors ${
                isLoading ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Day Filter */}
      {!isLoading && !error && activeDoctors.length > 0 && (
        <DayFilter
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <DoctorCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200/60 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-red-700 mb-2">
            Error Loading Doctors
          </h3>
          <p className="text-red-600 text-sm mb-6 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchDoctorsData}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105"
          >
            Try Again
          </button>
        </div>
      ) : activeDoctors.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200/60 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#4ad294]/20 to-[#3bb882]/20 flex items-center justify-center">
            <Stethoscope className="w-10 h-10 text-[#4ad294]" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            No Doctors Available
          </h3>
          <p className="text-gray-600 text-sm max-w-sm mx-auto">
            There are currently no active doctors in the system.
          </p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200/60 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
            <Calendar className="w-10 h-10 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            No Doctors Available on {activeFilter}
          </h3>
          <p className="text-gray-600 text-sm max-w-sm mx-auto">
            There are no doctors scheduled on this day. Try selecting a
            different day.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2">
          {filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.doctor_id}
              doctor={doctor}
              schedules={getDoctorWithSchedules(doctor)}
            />
          ))}
        </div>
      )}

      {/* Stats footer */}
      {!isLoading && !error && filteredDoctors.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Showing {filteredDoctors.length} of {activeDoctors.length} active
            doctor
            {activeDoctors.length !== 1 ? "s" : ""}
            {activeFilter !== "all" && ` on ${activeFilter}`}
          </p>
        </div>
      )}
    </motion.div>
  );
}
