"use client";

import { useState, useMemo } from "react";
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
}) {
  const [appointmentDate, setAppointmentDate] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [errors, setErrors] = useState({});
  const [dateError, setDateError] = useState("");

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split("T")[0];

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

    // Check if weekend
    if (newDate && !isWeekday(newDate)) {
      setDateError("Appointments are only available on weekdays.");
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
    } else if (!isWeekday(appointmentDate)) {
      newErrors.date = "Appointments are only available on weekdays.";
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

  // Generate time options based on selected schedule
  const getTimeOptions = () => {
    const schedule = filteredSchedules.find(
      (s) => s.schedule_id?.toString() === selectedSchedule,
    );

    if (!schedule) return [];

    const times = [];
    if (schedule.shift === "AM") {
      // Morning shift: 8:00 AM to 11:30 AM (30 min intervals)
      for (let hour = 8; hour < 12; hour++) {
        times.push({
          value: `${hour.toString().padStart(2, "0")}:00`,
          label: `${hour}:00 AM`,
        });
        times.push({
          value: `${hour.toString().padStart(2, "0")}:30`,
          label: `${hour}:30 AM`,
        });
      }
    } else if (schedule.shift === "PM") {
      // Afternoon shift: 1:00 PM to 4:30 PM (30 min intervals)
      for (let hour = 13; hour < 17; hour++) {
        const displayHour = hour > 12 ? hour - 12 : hour;
        times.push({
          value: `${hour.toString().padStart(2, "0")}:00`,
          label: `${displayHour}:00 PM`,
        });
        times.push({
          value: `${hour.toString().padStart(2, "0")}:30`,
          label: `${displayHour}:30 PM`,
        });
      }
    }

    return times;
  };

  const timeOptions = getTimeOptions();

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
            min={today}
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
              {timeOptions.map((time) => (
                <SelectItem key={time.value} value={time.value}>
                  {time.label}
                </SelectItem>
              ))}
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
