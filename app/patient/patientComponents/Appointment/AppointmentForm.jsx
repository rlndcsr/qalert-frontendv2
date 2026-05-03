"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Stethoscope,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import { ClipLoader } from "react-spinners";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTodayDateString, addLocalDaysToYMD } from "../patientUtils";

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

export default function AppointmentForm({
  schedules,
  reasonCategories,
  isLoadingSchedules,
  isLoadingReasonCategories,
  isBooking,
  onSubmit,
  getSchedulesForDate,
  isWeekday,
  bookedSlots = [],
  /** Block picking today after today's visit + queue are completed */
  hasCompletedVisitToday = false,
}) {
  const [appointmentDate, setAppointmentDate] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [errors, setErrors] = useState({});
  const [dateError, setDateError] = useState("");
  const currentTimeRef = useRef(new Date());

  // Keep current time ref fresh
  useEffect(() => {
    const interval = setInterval(() => {
      currentTimeRef.current = new Date();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const today = getTodayDateString();
  const minBookableDate =
    hasCompletedVisitToday && addLocalDaysToYMD(today, 1)
      ? addLocalDaysToYMD(today, 1)
      : today;

  // Get filtered schedules based on selected date
  const filteredSchedules = useMemo(() => {
    if (!appointmentDate || !isWeekday(appointmentDate)) return [];
    return getSchedulesForDate(appointmentDate);
  }, [appointmentDate, getSchedulesForDate, isWeekday]);

  // Check if date is valid weekday
  const isDateValid = useMemo(() => {
    return appointmentDate && isWeekday(appointmentDate);
  }, [appointmentDate, isWeekday]);

  // Check if no doctors available for the selected date
  const noDoctorsAvailable = useMemo(() => {
    return isDateValid && filteredSchedules.length === 0 && !isLoadingSchedules;
  }, [isDateValid, filteredSchedules, isLoadingSchedules]);

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setAppointmentDate(newDate);
    setSelectedSchedule("");
    setAppointmentTime("");
    setErrors((prev) => ({ ...prev, date: null }));

    // Check if Sunday (only day blocked now)
    if (newDate && newDate < minBookableDate) {
      setDateError(
        "You have already completed your visit for today. Choose a future date.",
      );
    } else if (newDate && !isWeekday(newDate)) {
      setDateError("Appointments are not available on Sundays.");
    } else {
      setDateError("");
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate fields
    const newErrors = {};

    if (!appointmentDate) {
      newErrors.date = "Please select a date";
    } else if (appointmentDate < minBookableDate) {
      newErrors.date =
        "You have already completed your visit for today. Choose a future date.";
    } else if (!isWeekday(appointmentDate)) {
      newErrors.date = "Appointments are not available on Sundays.";
    }

    if (!selectedSchedule) {
      newErrors.schedule = "Please select a doctor";
    }

    if (!selectedPurpose) {
      newErrors.purpose = "Please select a purpose";
    }

    if (!appointmentTime) {
      newErrors.time = "Please select a time";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Format time to H:i format (e.g., 09:00) - no seconds
    const formattedTime = appointmentTime.includes(":")
      ? appointmentTime.substring(0, 5) // Ensure only HH:MM
      : appointmentTime;

    onSubmit(selectedSchedule, appointmentDate, formattedTime, selectedPurpose);
  };

  // Generate time options based on selected schedule (20-min intervals)
  const timeOptions = useMemo(() => {
    const schedule = filteredSchedules.find(
      (s) => s.schedule_id?.toString() === selectedSchedule,
    );

    if (!schedule) return [];

    const times = [];
    const now = currentTimeRef.current;
    const isToday = appointmentDate === getTodayDateString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (schedule.shift === "AM") {
      // Morning shift: 8:00 AM to 11:40 AM (20-min intervals)
      for (let totalMin = 8 * 60; totalMin < 12 * 60; totalMin += 20) {
        const hour = Math.floor(totalMin / 60);
        const minute = totalMin % 60;
        times.push({
          value: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          label: `${hour}:${minute.toString().padStart(2, "0")} AM`,
          totalMin,
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
          totalMin,
        });
      }
    }

    // Filter out past times if booking for today
    if (isToday) {
      const currentTotalMin = currentHour * 60 + currentMinute;
      return times.filter((time) => {
        // For PM times, check if the time slot has already passed
        if (schedule.shift === "PM" && time.totalMin <= currentTotalMin) {
          return false;
        }
        return true;
      });
    }

    return times;
  }, [filteredSchedules, selectedSchedule, appointmentDate]);

  // Determine if form fields should be disabled
  const isScheduleDisabled =
    !isDateValid || noDoctorsAvailable || isLoadingSchedules;
  const isPurposeDisabled =
    !isDateValid || noDoctorsAvailable || isLoadingReasonCategories;
  const isTimeDisabled = !selectedSchedule || timeOptions.length === 0;
  const isSubmitDisabled =
    isBooking ||
    !isDateValid ||
    noDoctorsAvailable ||
    !selectedSchedule ||
    !selectedPurpose ||
    !appointmentTime;

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 max-w-lg mx-auto"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-[#D4F4E6] rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-[#4ad294]" />
        </div>
        <h2 className="text-xl font-semibold text-[#25323A] mb-2">
          Book an Appointment
        </h2>
        <p className="text-sm text-gray-500">
          You don't have an appointment yet.
          <br />
          Book one to join the queue.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Date Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>Select Date</span>
            </div>
          </label>
          <input
            type="date"
            value={appointmentDate}
            onChange={handleDateChange}
            min={minBookableDate}
            className={`w-full h-10 px-3 rounded-md border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4ad294] focus:border-[#4ad294] ${
              errors.date || dateError ? "border-red-500" : "border-gray-300"
            }`}
          />
          {(errors.date || dateError) && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.date || dateError}
            </p>
          )}
        </div>

        {/* Step 2: Doctor/Schedule Dropdown (filtered by date) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-gray-500" />
              <span>Select Doctor</span>
            </div>
          </label>
          {isLoadingSchedules && isDateValid ? (
            <div className="flex items-center justify-center h-10 bg-gray-50 rounded-md border border-gray-200">
              <ClipLoader size={18} color="#4ad294" />
            </div>
          ) : noDoctorsAvailable ? (
            <div className="flex items-center gap-2 h-10 px-3 bg-amber-50 rounded-md border border-amber-200 text-amber-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>No doctors available for the selected date.</span>
            </div>
          ) : (
            <Select
              value={selectedSchedule}
              onValueChange={(value) => {
                setSelectedSchedule(value);
                setAppointmentTime(""); // Reset time when schedule changes
                setErrors((prev) => ({ ...prev, schedule: null }));
              }}
              disabled={isScheduleDisabled}
            >
              <SelectTrigger
                className={`w-full ${errors.schedule ? "border-red-500" : ""} ${
                  isScheduleDisabled ? "bg-gray-50 cursor-not-allowed" : ""
                }`}
              >
                <SelectValue
                  placeholder={
                    !appointmentDate ? "Select a date first" : "Select a doctor"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredSchedules.map((schedule) => {
                  const fullDay =
                    DAY_ABBREV_TO_FULL[schedule.day] || schedule.day;
                  const timeRange = getShiftTimeRange(schedule.shift);
                  return (
                    <SelectItem
                      key={schedule.schedule_id}
                      value={schedule.schedule_id?.toString()}
                    >
                      {schedule.doctor_name} – {fullDay} | {timeRange}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
          {errors.schedule && (
            <p className="mt-1 text-xs text-red-500">{errors.schedule}</p>
          )}
        </div>

        {/* Step 3: Purpose of Appointment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-gray-500" />
              <span>Purpose of Appointment</span>
            </div>
          </label>
          {isLoadingReasonCategories ? (
            <div className="flex items-center justify-center h-10 bg-gray-50 rounded-md border border-gray-200">
              <ClipLoader size={18} color="#4ad294" />
            </div>
          ) : (
            <Select
              value={selectedPurpose}
              onValueChange={(value) => {
                setSelectedPurpose(value);
                setErrors((prev) => ({ ...prev, purpose: null }));
              }}
              disabled={isPurposeDisabled}
            >
              <SelectTrigger
                className={`w-full ${errors.purpose ? "border-red-500" : ""} ${
                  isPurposeDisabled ? "bg-gray-50 cursor-not-allowed" : ""
                }`}
              >
                <SelectValue
                  placeholder={
                    !appointmentDate
                      ? "Select a date first"
                      : "Select purpose of visit"
                  }
                />
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

        {/* Step 4: Time Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>Select Time</span>
            </div>
          </label>
          <Select
            value={appointmentTime}
            onValueChange={(value) => {
              setAppointmentTime(value);
              setErrors((prev) => ({ ...prev, time: null }));
            }}
            disabled={isTimeDisabled}
          >
            <SelectTrigger
              className={`w-full ${errors.time ? "border-red-500" : ""} ${
                isTimeDisabled ? "bg-gray-50 cursor-not-allowed" : ""
              }`}
            >
              <SelectValue
                placeholder={
                  !selectedSchedule ? "Select a doctor first" : "Select a time"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => {
                const isBooked = bookedSlots.includes(time.value);
                return (
                  <SelectItem
                    key={time.value}
                    value={time.value}
                    disabled={isBooked}
                    className={isBooked ? "text-gray-400" : ""}
                  >
                    {isBooked ? `${time.label} — Already booked` : time.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {errors.time && (
            <p className="mt-1 text-xs text-red-500">{errors.time}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={`w-full flex items-center justify-center gap-2 bg-[#4ad294] hover:bg-[#3bb882] text-white px-6 py-3 rounded-md shadow-sm transition-all duration-200 font-medium ${
            isSubmitDisabled
              ? "opacity-70 cursor-not-allowed"
              : "cursor-pointer hover:shadow-md"
          }`}
        >
          {isBooking ? (
            <>
              <ClipLoader size={18} color="#ffffff" />
              <span>Booking...</span>
            </>
          ) : (
            <>
              <Calendar className="w-5 h-5" />
              <span>Book Appointment</span>
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
