"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
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
  CalendarCheck,
  Timer,
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

// Calendar Component - Enhanced UI
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
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
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
      const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
      return dayMap[schedule.day] === date.getDay();
    });
  };

  const normalizedAppointmentDates = appointmentDates
    .map((d) => toYMD(d))
    .filter(Boolean);
  const hasAppointment = (dateStr) =>
    normalizedAppointmentDates.includes(dateStr);

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Card Header */}
      <div className="bg-gradient-to-r from-[#4ad294] to-[#3bb882] px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Select Date</h3>
              <p className="text-sm text-white/80">Choose an available date</p>
            </div>
          </div>
          <div className="text-white/90 text-sm font-medium">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="px-6 pt-5 pb-3 flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={goToNextMonth}
          className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="px-6 grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-400 py-2 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="px-6 pb-4 grid grid-cols-7 gap-1">
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
                aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all duration-200 relative
                ${
                  isAppointment
                    ? "bg-gradient-to-br from-[#00968a] to-[#007a70] text-white shadow-lg shadow-[#00968a]/30 cursor-default"
                    : isSelected
                      ? "bg-gradient-to-br from-[#4ad294] to-[#3bb882] text-white shadow-lg shadow-[#4ad294]/30"
                      : isPast
                        ? "text-gray-200 cursor-not-allowed"
                        : isWeekend
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-700 hover:bg-[#4ad294]/10 hover:scale-105 cursor-pointer"
                }
                ${isToday && !isSelected && !isAppointment ? "ring-2 ring-[#4ad294]/40 ring-offset-1" : ""}
              `}
            >
              <span className={isSelected || isAppointment ? "text-white" : ""}>
                {date.getDate()}
              </span>
              {!isAppointment && !isPast && hasDoctors && !isWeekend && (
                <div
                  className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/70" : "bg-[#4ad294]"}`}
                />
              )}
              {isAppointment && (
                <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-white/70" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-6 pb-5 flex flex-wrap gap-4 text-xs text-gray-500 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-lg bg-gradient-to-br from-[#4ad294] to-[#3bb882]" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-lg ring-2 ring-[#4ad294]/40" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-lg bg-gray-100" />
          <span>Weekend</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-lg bg-[#00968a]" />
          <span>Appointment</span>
        </div>
      </div>
    </motion.div>
  );
}

// Doctor Card Component
function DoctorCard({ schedule, isSelected, onClick }) {
  const getShiftTimeRange = (shift) => {
    if (shift === "AM") return "8:00 AM – 12:00 NN";
    if (shift === "PM") return "1:00 PM – 5:00 PM";
    return shift;
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer ${
        isSelected
          ? "border-[#4ad294] bg-gradient-to-br from-[#4ad294]/5 to-[#3bb882]/5 shadow-md shadow-[#4ad294]/10"
          : "border-gray-100 bg-white hover:border-[#4ad294]/30 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isSelected
              ? "bg-gradient-to-br from-[#4ad294] to-[#3bb882] shadow-md"
              : "bg-gray-100"
          }`}
        >
          <User
            className={`w-6 h-6 ${isSelected ? "text-white" : "text-gray-500"}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`font-semibold text-sm truncate ${isSelected ? "text-[#4ad294]" : "text-gray-900"}`}
          >
            {schedule.doctor_name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-xs text-gray-500">
              {getShiftTimeRange(schedule.shift)}
            </p>
          </div>
        </div>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-6 h-6 rounded-full bg-[#4ad294] flex items-center justify-center"
          >
            <CheckCircle className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}

// Time Slot Button Component
function TimeSlotButton({ time, isBooked, isSelected, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isBooked}
      whileHover={!isBooked ? { scale: 1.05 } : {}}
      whileTap={!isBooked ? { scale: 0.95 } : {}}
      className={`
        px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
        ${
          isBooked
            ? "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
            : isSelected
              ? "bg-gradient-to-r from-[#4ad294] to-[#3bb882] text-white shadow-md shadow-[#4ad294]/20"
              : "bg-gray-50 text-gray-700 hover:bg-[#4ad294]/10 border border-gray-200 hover:border-[#4ad294]/30"
        }
      `}
    >
      {time.label}
    </motion.button>
  );
}

// Booking Panel Component - Enhanced UI
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

  const getShiftTimeRange = (shift) => {
    if (shift === "AM") return "8:00 AM – 12:00 NN";
    if (shift === "PM") return "1:00 PM – 5:00 PM";
    return shift;
  };

  const availableSchedules = useMemo(() => {
    if (!selectedDate) return [];
    return getSchedulesForDate(selectedDate);
  }, [selectedDate, getSchedulesForDate]);

  const timeOptions = useMemo(() => {
    if (!selectedSchedule) return [];
    const [schedId] = selectedSchedule.split("-");
    const schedule = availableSchedules.find(
      (s) => s.schedule_id?.toString() === schedId,
    );
    if (!schedule) return [];

    const times = [];
    if (schedule.shift === "AM") {
      for (let totalMin = 8 * 60; totalMin < 12 * 60; totalMin += 20) {
        const hour = Math.floor(totalMin / 60);
        const minute = totalMin % 60;
        times.push({
          value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          label: `${hour}:${minute.toString().padStart(2, "0")} AM`,
        });
      }
    } else if (schedule.shift === "PM") {
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

  useEffect(() => {
    if (!selectedDate || !selectedSchedule || !fetchBookedSlotsForDate) {
      setBookedSlots([]);
      return;
    }
    setIsLoadingBookedSlots(true);
    const [schedId] = selectedSchedule.split("-");
    fetchBookedSlotsForDate(selectedDate, schedId)
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
    const [schedId] = selectedSchedule.split("-");
    onSubmit(schedId, selectedDate, formattedTime, selectedPurpose);
  };

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
    <motion.div
      className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      {/* Card Header */}
      <div className="bg-gradient-to-r from-[#4ad294] to-[#3bb882] px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Book Your Appointment
            </h3>
            <p className="text-sm text-white/80">
              Complete the form below to schedule
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Selected Date Banner */}
        {selectedDate ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-gradient-to-br from-[#4ad294]/10 to-[#3bb882]/5 rounded-xl border border-[#4ad294]/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4ad294] flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#4ad294] uppercase tracking-wide">
                  Selected Date
                </p>
                <p className="text-base font-bold text-gray-900 mt-0.5">
                  {formatDate(selectedDate)}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800 font-medium">
                Please select a date from the calendar to continue
              </p>
            </div>
          </div>
        )}

        {/* Doctors Section */}
        {selectedDate && (
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#4ad294]" />
              Available Doctors
            </h4>
            {isLoadingSchedules ? (
              <div className="flex items-center justify-center py-8">
                <ClipLoader size={24} color="#4ad294" />
              </div>
            ) : availableSchedules.length > 0 ? (
              <div className="space-y-2">
                {availableSchedules.map((schedule) => (
                  <DoctorCard
                    key={`${schedule.schedule_id}-${schedule.doctor_id}`}
                    schedule={schedule}
                    isSelected={
                      selectedSchedule === `${schedule.schedule_id}-${schedule.doctor_id}`
                    }
                    onClick={() => {
                      const newKey = `${schedule.schedule_id}-${schedule.doctor_id}`;
                      const newShift = schedule.shift;
                      // Only clear time if shift changes (e.g., AM → PM or PM → AM)
                      const prevKey = selectedSchedule;
                      let sameShift = false;
                      if (prevKey) {
                        const prevSched = availableSchedules.find(
                          (s) => `${s.schedule_id}-${s.doctor_id}` === prevKey,
                        );
                        sameShift = prevSched?.shift === newShift;
                      }
                      setSelectedSchedule(newKey);
                      if (!sameShift) setAppointmentTime("");
                      setErrors((prev) => ({ ...prev, schedule: null }));
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-medium">
                    No doctors available on this date
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Booking Form */}
        {selectedDate && availableSchedules.length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-5" />

            {/* Booking Form */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-gray-400" />
                  <span>Purpose of Visit</span>
                </div>
              </label>
              {isLoadingReasonCategories ? (
                <div className="h-12 bg-gray-50 rounded-xl border flex items-center justify-center">
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
                    className={`h-12 ${errors.purpose ? "border-red-400 bg-red-50" : "bg-gray-50 hover:bg-gray-100"}`}
                  >
                    <SelectValue placeholder="Select purpose" />
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
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {errors.purpose}
                </motion.p>
              )}
            </div>

            {/* Time */}
            {selectedSchedule && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {/* <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-gray-400" />
                    <span>Appointment Time</span>
                  </div> */}
                </label>
                {isLoadingBookedSlots ? (
                  <div className="h-12 bg-gray-50 rounded-xl border flex items-center justify-center">
                    <ClipLoader size={18} color="#4ad294" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {timeOptions.map((time) => {
                      const isBooked = bookedSlots.includes(time.value);
                      return (
                        <TimeSlotButton
                          key={time.value}
                          time={time}
                          isBooked={isBooked}
                          isSelected={appointmentTime === time.value}
                          onClick={() => {
                            setAppointmentTime(time.value);
                            setErrors((prev) => ({ ...prev, time: null }));
                          }}
                        />
                      );
                    })}
                  </div>
                )}
                {errors.time && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-xs text-red-500 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.time}
                  </motion.p>
                )}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isBooking}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#4ad294] to-[#3bb882] hover:from-[#3bb882] hover:to-[#2fa872] text-white px-6 py-4 rounded-xl shadow-lg shadow-[#4ad294]/25 transition-all duration-300 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isBooking ? (
                <>
                  <ClipLoader size={20} color="#ffffff" />
                  <span>Booking...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span className="hover:cursor-pointer">
                    Confirm Appointment
                  </span>
                </>
              )}
            </motion.button>
          </form>
        )}
      </div>
    </motion.div>
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

  if (isLoading) {
    return (
      <motion.div
        className="w-full max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#4ad294]/10 animate-pulse" />
            <div>
              <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
            <div className="h-7 w-32 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-7 gap-2">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
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
          <div className="w-10 h-10 rounded-xl bg-[#4ad294]/10 flex items-center justify-center">
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
