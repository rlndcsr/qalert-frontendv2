"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ClipLoader } from "react-spinners";
import {
  Clock,
  CalendarDays,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { getAuthToken } from "./patientUtils";

const API_BASE_URL = "/api/proxy";

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

export default function RescheduleDialog({
  isOpen,
  onClose,
  appointment,
  schedule,
  onSuccess,
}) {
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [error, setError] = useState(null);

  // Build time options based on shift (AM: 8-12, PM: 13-17), filtering past times if appointment is today
  const timeOptions = useMemo(() => {
    if (!schedule?.shift) return [];
    const times = [];
    const now = new Date();

    // Check if appointment is today
    const aptDateStr = appointment?.appointment_date
      ? String(appointment.appointment_date).split("T")[0]
      : null;
    const todayStr = now.toISOString().split("T")[0];
    const isToday = aptDateStr === todayStr;

    const currentTotalMin = isToday ? (now.getHours() * 60 + now.getMinutes()) : null;

    if (schedule.shift === "AM") {
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

    // If appointment is today, filter out times that have already passed
    if (isToday && currentTotalMin !== null) {
      return times.filter((t) => t.totalMin > currentTotalMin);
    }

    return times;
  }, [schedule?.shift, appointment?.appointment_date]);

  // Fetch booked slots for the appointment's date + schedule + doctor
  useEffect(() => {
    if (!isOpen || !appointment || !schedule) return;

    setIsLoadingSlots(true);
    setBookedSlots([]);
    setSelectedTime("");
    setError(null);

    const token = getAuthToken();
    if (!token) {
      setError("Not authenticated");
      setIsLoadingSlots(false);
      return;
    }

    fetch(`${API_BASE_URL}/appointments`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : data?.data || data?.appointments || data?.items || [];

        const dateStr = appointment.appointment_date
          ? String(appointment.appointment_date).split("T")[0]
          : "";

        const matching = list.filter((apt) => {
          const aptDate = String(apt.appointment_date || "").split("T")[0];
          const status = (apt.status || apt.appointment_status || "").toLowerCase();
          const sameSchedule =
            apt.schedule_id?.toString() === schedule.schedule_id?.toString();
          const sameDoctor =
            appointment.doctor_id &&
            apt.doctor_id?.toString() === appointment.doctor_id?.toString();
          const sameDate = aptDate === dateStr;
          // Exclude cancelled, exclude current appointment
          const notCancelled = status !== "cancelled";
          const notCurrent = apt.appointment_id !== appointment.appointment_id;
          return sameDate && sameSchedule && sameDoctor && notCancelled && notCurrent;
        });

        setBookedSlots(matching.map((apt) => (apt.appointment_time || "").substring(0, 5)));
      })
      .catch((err) => {
        console.error("[RescheduleDialog] fetch error:", err);
        setError("Failed to load available times");
      })
      .finally(() => setIsLoadingSlots(false));
  }, [isOpen, appointment, schedule]);

  const handleReschedule = async () => {
    if (!selectedTime) return;

    setIsRescheduling(true);
    setError(null);

    const token = getAuthToken();
    if (!token) {
      setError("Not authenticated");
      setIsRescheduling(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/appointments/${appointment.appointment_id || appointment.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            appointment_time: selectedTime,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to reschedule appointment");
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setIsRescheduling(false);
    }
  };

  // Don't render if no appointment
  if (!appointment) return null;

  const currentTime = appointment.appointment_time
    ? formatTime(appointment.appointment_time)
    : "";

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent
            asChild
            className="sm:max-w-md p-0 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="p-6">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-[#4ad294]" />
                    Reschedule Appointment
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-500 mt-1">
                    Select a new time for your appointment. Only available (vacant) slots are shown.
                  </DialogDescription>
                </DialogHeader>

                {/* Current Time Display */}
                <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Current Time</span>
                  </div>
                  <p className="text-base font-semibold text-gray-700">{currentTime}</p>
                </div>

                {/* Time Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select New Time
                  </label>

                  {isLoadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <ClipLoader size={24} color="#4ad294" />
                    </div>
                  ) : error ? (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-xs text-red-600">{error}</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {timeOptions.map((time) => {
                        const isBooked = bookedSlots.includes(time.value);
                        const currentTimeValue = (appointment.appointment_time || "").substring(0, 5);
                        const isCurrentTime = time.value === currentTimeValue;
                        const isDisabled = isBooked || isCurrentTime;
                        const isSelected = selectedTime === time.value;
                        return (
                          <button
                            key={time.value}
                            type="button"
                            onClick={() => !isDisabled && setSelectedTime(time.value)}
                            disabled={isDisabled}
                            className={`
                              px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
                              ${
                                isDisabled
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
                                  : isSelected
                                    ? "bg-gradient-to-r from-[#4ad294] to-[#3bb882] text-white shadow-md shadow-[#4ad294]/20"
                                    : "bg-gray-50 text-gray-700 hover:bg-[#4ad294]/10 border border-gray-200 hover:border-[#4ad294]/30"
                              }
                            `}
                          >
                            {time.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Note */}
                <div className="mb-5 text-xs rounded-md border border-amber-200 bg-amber-50 text-amber-800 p-3">
                  <span className="font-medium">Note:</span> Rescheduling will automatically
                  update your queue position. No email confirmation will be sent.
                </div>

                {error && !isLoadingSlots && (
                  <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                )}

                <DialogFooter className="gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isRescheduling}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReschedule}
                    disabled={!selectedTime || selectedTime === (appointment.appointment_time || "").substring(0, 5) || isRescheduling}
                    className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#4ad294] to-[#3bb882] rounded-lg hover:from-[#3bb882] hover:to-[#2fa872] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isRescheduling ? (
                      <>
                        <ClipLoader size={14} color="#ffffff" />
                        <span>Rescheduling...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Reschedule</span>
                      </>
                    )}
                  </button>
                </DialogFooter>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}