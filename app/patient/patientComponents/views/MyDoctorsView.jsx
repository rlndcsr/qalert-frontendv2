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
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 animate-pulse">
      <div className="flex flex-col items-center">
        {/* Avatar skeleton */}
        <div className="w-24 h-24 rounded-full bg-gray-200 mb-4" />
        {/* Name skeleton */}
        <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
        {/* Divider */}
        <div className="w-full h-px bg-gray-100 mb-4" />
        {/* Schedule label skeleton */}
        <div className="h-3 w-16 bg-gray-200 rounded mb-3" />
        {/* Schedule items skeleton */}
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-44 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

// Filter pills component
function DayFilter({ activeFilter, onFilterChange }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onFilterChange(option.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeFilter === option.id
                ? "bg-[#4ad294] text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {option.label}
          </button>
        ))}
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
      (ds) => ds.doctor_id === doctor.doctor_id
    );

    // Map to actual schedule details
    const doctorScheduleDetails = doctorScheduleEntries
      .map((ds) => {
        const schedule = schedules.find(
          (s) => s.schedule_id === ds.schedule_id
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
      (ds) => ds.doctor_id === doctor.doctor_id
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
      doctorHasScheduleOnDay(doctor, activeFilter)
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#4ad294]/10 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-[#4ad294]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Doctors</h1>
            <p className="text-sm text-gray-500">
              View available doctors and their schedules
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchDoctorsData}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw
            className={`w-5 h-5 text-gray-500 ${
              isLoading ? "animate-spin" : ""
            }`}
          />
        </button>
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
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <DoctorCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-medium mb-2">Error loading doctors</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={fetchDoctorsData}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : activeDoctors.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Stethoscope className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Doctors Available
          </h3>
          <p className="text-gray-500 text-sm">
            There are currently no active doctors in the system.
          </p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No Doctors Available on {activeFilter}
          </h3>
          <p className="text-gray-500 text-sm">
            There are no doctors scheduled on this day. Try selecting a
            different day.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
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
