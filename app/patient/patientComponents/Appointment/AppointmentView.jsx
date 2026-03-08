"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Stethoscope,
  Clock,
  User,
  ClipboardList,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useAppointment } from "./useAppointment";
import AppointmentCard from "./AppointmentCard";
import { toYMD } from "../patientUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipLoader } from "react-spinners";

// Calendar Component
function Calendar({
  selectedDate,
  onDateSelect,
  schedules,
  isWeekday,
  appointmentDates = [],
  initialMonth = null,
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (initialMonth) {
      // Strip time portion to safely parse "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS"
      const datePart = String(initialMonth).split("T")[0].split(" ")[0];
      const parts = datePart.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        if (!isNaN(year) && !isNaN(month)) {
          return new Date(year, month, 1);
        }
      }
    }
    return new Date();
  });

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [currentMonth]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
    );
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const formatDateToYMD = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const hasSchedule = (date) => {
    if (!date) return false;
    const dateStr = formatDateToYMD(date);
    return schedules.some((schedule) => {
      // Check if the schedule's day matches this date's day
      const dayMap = {
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
        Sun: 0,
      };
      return dayMap[schedule.day] === date.getDay();
    });
  };

  // Normalize to YYYY-MM-DD using local timezone (toYMD handles UTC ISO strings correctly)
  const normalizedAppointmentDates = appointmentDates
    .map((d) => toYMD(d))
    .filter(Boolean);
  const hasAppointment = (dateStr) =>
    normalizedAppointmentDates.includes(dateStr);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6">
      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {daysInMonth.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = formatDateToYMD(date);
          const isSelected = selectedDate === dateStr;
          const isToday = date.getTime() === today.getTime();
          const isPast = date < today;
          const isWeekend = !isWeekday(dateStr);
          const hasDoctors = hasSchedule(date);
          const isAppointment = hasAppointment(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() =>
                !isPast && !isAppointment && onDateSelect?.(dateStr)
              }
              disabled={isPast}
              className={`
                aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all duration-200
                ${
                  isAppointment
                    ? "bg-gradient-to-br from-[#00968a] to-[#007a70] text-white shadow-lg shadow-[#00968a]/40 scale-105 cursor-default"
                    : isSelected
                      ? "bg-gradient-to-br from-[#4ad294] to-[#3bb882] text-white shadow-lg shadow-[#4ad294]/30 scale-105"
                      : isPast
                        ? "text-gray-300 cursor-not-allowed"
                        : isWeekend
                          ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                          : "text-gray-700 hover:bg-[#4ad294]/10 hover:scale-105 cursor-pointer"
                }
                ${isToday && !isSelected && !isAppointment ? "ring-2 ring-[#4ad294]/50" : ""}
              `}
            >
              <span className="mb-0.5">{date.getDate()}</span>
              {isAppointment && (
                <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
              )}
              {!isAppointment && !isPast && hasDoctors && !isWeekend && (
                <div
                  className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-[#4ad294]"}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-600">
        {!appointmentDates.length && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-[#4ad294] to-[#3bb882]" />
            <span>Selected</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded ring-2 ring-[#4ad294]/50" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-50" />
          <span>Weekend</span>
        </div>
        {appointmentDates.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#00968a]" />
            <span>Your Appointment</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Booking Panel Component
function BookingPanel({
  selectedDate,
  schedules,
  reasonCategories,
  isLoadingSchedules,
  isLoadingReasonCategories,
  isBooking,
  onSubmit,
  getSchedulesForDate,
  fetchBookedSlotsForDate,
}) {
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [errors, setErrors] = useState({});
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isLoadingBookedSlots, setIsLoadingBookedSlots] = useState(false);

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

  const getShiftTimeRange = (shift) => {
    if (shift === "AM") return "8:00 AM – 12:00 NN";
    if (shift === "PM") return "1:00 PM – 5:00 PM";
    return shift;
  };

  // Get schedules for selected date
  const availableSchedules = useMemo(() => {
    if (!selectedDate) return [];
    return getSchedulesForDate(selectedDate);
  }, [selectedDate, getSchedulesForDate]);

  // Generate time options based on selected schedule (20-min intervals)
  const timeOptions = useMemo(() => {
    const schedule = availableSchedules.find(
      (s) => s.schedule_id?.toString() === selectedSchedule,
    );

    if (!schedule) return [];

    const times = [];
    if (schedule.shift === "AM") {
      // Morning shift: 8:00 AM to 11:40 AM (20-min intervals)
      for (let totalMin = 8 * 60; totalMin < 12 * 60; totalMin += 20) {
        const hour = Math.floor(totalMin / 60);
        const minute = totalMin % 60;
        times.push({
          value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          label: `${hour}:${minute.toString().padStart(2, "0")} AM`,
        });
      }
    } else if (schedule.shift === "PM") {
      // Afternoon shift: 1:00 PM to 4:40 PM (20-min intervals)
      for (let totalMin = 13 * 60; totalMin < 17 * 60; totalMin += 20) {
        const hour = Math.floor(totalMin / 60);
        const minute = totalMin % 60;
        const displayHour = hour > 12 ? hour - 12 : hour;
        times.push({
          value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          label: `${displayHour}:${minute.toString().padStart(2, "0")} PM`,
        });
      }
    }
    return times;
  }, [selectedSchedule, availableSchedules]);

  // Fetch booked slots whenever date + schedule combination changes
  useEffect(() => {
    if (!selectedDate || !selectedSchedule || !fetchBookedSlotsForDate) {
      setBookedSlots([]);
      return;
    }
    setIsLoadingBookedSlots(true);
    fetchBookedSlotsForDate(selectedDate, selectedSchedule)
      .then((slots) => setBookedSlots(slots))
      .finally(() => setIsLoadingBookedSlots(false));
  }, [selectedDate, selectedSchedule, fetchBookedSlotsForDate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!selectedSchedule) newErrors.schedule = "Please select a doctor";
    if (!selectedPurpose) newErrors.purpose = "Please select a purpose";
    if (!appointmentTime) newErrors.time = "Please select a time";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formattedTime = appointmentTime.includes(":")
      ? appointmentTime.substring(0, 5)
      : appointmentTime;

    onSubmit(selectedSchedule, selectedDate, formattedTime, selectedPurpose);
  };

  // Reset form when date changes
  useEffect(() => {
    setSelectedSchedule("");
    setSelectedPurpose("");
    setAppointmentTime("");
    setErrors({});
    setBookedSlots([]);
  }, [selectedDate]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-[#4ad294]/10 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-[#4ad294]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Book Appointment
            </h3>
            <p className="text-xs text-gray-500">Schedule your visit</p>
          </div>
        </div>
      </div>

      {/* Selected Date Info */}
      {selectedDate ? (
        <div className="mb-6 p-4 bg-gradient-to-br from-[#4ad294]/10 to-[#3bb882]/10 rounded-xl border border-[#4ad294]/20">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#4ad294] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Selected Date
              </p>
              <p className="text-sm text-gray-700">
                {formatDate(selectedDate)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Please select a date from the calendar to continue
            </p>
          </div>
        </div>
      )}

      {/* Doctors on Duty */}
      {selectedDate && (
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#4ad294]" />
            Doctors on Duty
          </h4>
          {isLoadingSchedules ? (
            <div className="flex items-center justify-center py-8">
              <ClipLoader size={24} color="#4ad294" />
            </div>
          ) : availableSchedules.length > 0 ? (
            <div className="space-y-2">
              {availableSchedules.map((schedule) => (
                <div
                  key={schedule.schedule_id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4ad294] to-[#3bb882] flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {schedule.doctor_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {getShiftTimeRange(schedule.shift)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">
                  No doctors available on this date
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking Form */}
      {selectedDate && availableSchedules.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6" />

          {/* Select Doctor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-gray-500" />
                <span>Select Doctor</span>
              </div>
            </label>
            <Select
              value={selectedSchedule}
              onValueChange={(value) => {
                setSelectedSchedule(value);
                setAppointmentTime("");
                setErrors((prev) => ({ ...prev, schedule: null }));
              }}
            >
              <SelectTrigger
                className={errors.schedule ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Choose your doctor" />
              </SelectTrigger>
              <SelectContent>
                {availableSchedules.map((schedule) => (
                  <SelectItem
                    key={schedule.schedule_id}
                    value={schedule.schedule_id?.toString()}
                  >
                    {schedule.doctor_name} – {getShiftTimeRange(schedule.shift)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.schedule && (
              <p className="mt-1 text-xs text-red-500">{errors.schedule}</p>
            )}
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-gray-500" />
                <span>Purpose of Visit</span>
              </div>
            </label>
            {isLoadingReasonCategories ? (
              <div className="flex items-center justify-center h-10 bg-gray-50 rounded-md border">
                <ClipLoader size={18} color="#4ad294" />
              </div>
            ) : (
              <Select
                value={selectedPurpose}
                onValueChange={(value) => {
                  setSelectedPurpose(value);
                  setErrors((prev) => ({ ...prev, purpose: null }));
                }}
              >
                <SelectTrigger
                  className={errors.purpose ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select purpose of visit" />
                </SelectTrigger>
                <SelectContent>
                  {reasonCategories.map((category) => (
                    <SelectItem
                      key={category.reason_category_id || category.id}
                      value={(
                        category.reason_category_id || category.id
                      )?.toString()}
                    >
                      {category.category_name || category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.purpose && (
              <p className="mt-1 text-xs text-red-500">{errors.purpose}</p>
            )}
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>Appointment Time</span>
              </div>
            </label>
            <Select
              value={appointmentTime}
              onValueChange={(value) => {
                setAppointmentTime(value);
                setErrors((prev) => ({ ...prev, time: null }));
              }}
              disabled={!selectedSchedule}
            >
              <SelectTrigger
                className={`${errors.time ? "border-red-500" : ""} ${!selectedSchedule ? "bg-gray-50" : ""}`}
              >
                <SelectValue
                  placeholder={
                    !selectedSchedule
                      ? "Select doctor first"
                      : "Choose time slot"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {isLoadingBookedSlots ? (
                  <div className="flex items-center justify-center py-4">
                    <ClipLoader size={16} color="#4ad294" />
                  </div>
                ) : (
                  timeOptions.map((time) => {
                    const isBooked = bookedSlots.includes(time.value);
                    return (
                      <SelectItem
                        key={time.value}
                        value={time.value}
                        disabled={isBooked}
                        className={isBooked ? "text-gray-400" : ""}
                      >
                        {isBooked
                          ? `${time.label} — Already booked`
                          : time.label}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
            {errors.time && (
              <p className="mt-1 text-xs text-red-500">{errors.time}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isBooking}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#4ad294] to-[#3bb882] hover:from-[#3bb882] hover:to-[#2fa872] text-white px-6 py-3 rounded-xl shadow-lg shadow-[#4ad294]/30 transition-all duration-300 font-semibold hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Confirm Appointment</span>
          </button>
        </form>
      )}
    </div>
  );
}

export default function AppointmentView() {
  const [selectedDate, setSelectedDate] = useState("");

  const {
    schedules,
    reasonCategories,
    activeAppointment,
    isLoadingAppointments,
    isLoadingSchedules,
    isLoadingReasonCategories,
    isBooking,
    isCancelling,
    error,
    bookAppointment,
    cancelAppointment,
    getSchedulesForDate,
    isWeekday,
    fetchBookedSlotsForDate,
  } = useAppointment();

  const isLoading = isLoadingAppointments || isLoadingSchedules;

  const appointmentSchedule = activeAppointment
    ? schedules.find((s) => s.schedule_id === activeAppointment.schedule_id)
    : null;

  // Show loading state
  if (isLoading) {
    return (
      <motion.div
        className="w-full max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#4ad294]/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-[#4ad294]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Book Appointment
              </h2>
              <p className="text-sm text-gray-500">
                Schedule your healthcare visit
              </p>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6">
          {/* Calendar Skeleton */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6 animate-pulse">
            <div className="h-7 w-40 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-7 gap-2">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
          {/* Panel Skeleton */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6 animate-pulse">
            <div className="h-8 w-40 bg-gray-200 rounded mb-6" />
            <div className="space-y-4">
              <div className="h-20 bg-gray-100 rounded-xl" />
              <div className="h-40 bg-gray-100 rounded-xl" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Show error state
  if (error) {
    return (
      <motion.div
        className="w-full max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200/60 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-red-700 mb-2">
            Error Loading Appointments
          </h3>
          <p className="text-red-600 text-sm max-w-md mx-auto">{error}</p>
        </div>
      </motion.div>
    );
  }

  // Main calendar view
  return (
    <motion.div
      className="w-full max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#4ad294]/10 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-[#4ad294]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {activeAppointment ? "My Appointment" : "Book Appointment"}
            </h2>
            <p className="text-sm text-gray-500">
              {activeAppointment
                ? "View your scheduled appointment"
                : "Select a date and schedule your visit"}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Calendar — marks appointment date when one exists */}
        <Calendar
          selectedDate={activeAppointment ? "" : selectedDate}
          onDateSelect={activeAppointment ? undefined : setSelectedDate}
          schedules={schedules}
          isWeekday={isWeekday}
          appointmentDates={
            activeAppointment ? [activeAppointment.appointment_date] : []
          }
          initialMonth={
            activeAppointment ? toYMD(activeAppointment.appointment_date) : null
          }
        />

        {/* Appointment details or Booking Panel */}
        {activeAppointment ? (
          <AppointmentCard
            appointment={activeAppointment}
            schedule={appointmentSchedule}
            reasonCategoryName={(() => {
              const cat = reasonCategories.find(
                (c) =>
                  (c.reason_category_id || c.id)?.toString() ===
                  activeAppointment.reason_category_id?.toString(),
              );
              return cat?.category_name || cat?.name || null;
            })()}
            isCancelling={isCancelling}
            onCancel={cancelAppointment}
          />
        ) : (
          <BookingPanel
            selectedDate={selectedDate}
            schedules={schedules}
            reasonCategories={reasonCategories}
            isLoadingSchedules={isLoadingSchedules}
            isLoadingReasonCategories={isLoadingReasonCategories}
            isBooking={isBooking}
            onSubmit={bookAppointment}
            getSchedulesForDate={getSchedulesForDate}
            fetchBookedSlotsForDate={fetchBookedSlotsForDate}
          />
        )}
      </div>
    </motion.div>
  );
}
