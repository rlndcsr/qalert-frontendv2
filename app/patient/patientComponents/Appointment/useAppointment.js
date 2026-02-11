"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getAuthToken, getTodayDateString, toYMD } from "../patientUtils";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_BASE_URL ||
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

// Day index to abbreviation mapping (0 = Sunday, 1 = Monday, etc.)
const DAY_INDEX_TO_ABBREV = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

export function useAppointment() {
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [reasonCategories, setReasonCategories] = useState([]);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [isLoadingReasonCategories, setIsLoadingReasonCategories] =
    useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState(null);

  // Get logged-in user ID from localStorage
  const getUserId = useCallback(() => {
    if (typeof window === "undefined") return null;
    // Try 'userData' first (used by useAuth hook), then fall back to 'user'
    const userStr =
      localStorage.getItem("userData") || localStorage.getItem("user");
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return user?.id || user?.user_id || user?.uid || null;
    } catch {
      return null;
    }
  }, []);

  // Fetch all appointments and filter for the logged-in user
  const fetchAppointments = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setError("You are not authenticated. Please log in again.");
      setIsLoadingAppointments(false);
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setError("Unable to determine your user ID.");
      setIsLoadingAppointments(false);
      return;
    }

    setIsLoadingAppointments(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        // Handle ngrok or API errors gracefully
        console.warn("[fetchAppointments] Failed to fetch:", response.status);
        setAppointments([]);
        setActiveAppointment(null);
        setIsLoadingAppointments(false);
        return;
      }

      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : data?.data || data?.appointments || data?.items || [];

      // Filter appointments for the logged-in user
      const userAppointments = list.filter((apt) => {
        const aptUserId = apt?.user_id ?? apt?.user?.id;
        return aptUserId == userId;
      });

      setAppointments(userAppointments);

      // Find active appointment (today or future, not cancelled)
      const today = getTodayDateString();
      const activeApt = userAppointments.find((apt) => {
        const aptDate = toYMD(apt?.appointment_date);
        if (!aptDate) return false;

        // Check if date is today or in the future
        const isValidDate = aptDate >= today;

        // Check if status is not cancelled
        const status = (apt?.status || "").toLowerCase();
        const isNotCancelled = status !== "cancelled";

        return isValidDate && isNotCancelled;
      });

      setActiveAppointment(activeApt || null);
    } catch (err) {
      console.error("[fetchAppointments] Error:", err);
      setError(err.message || "Failed to fetch appointments");
    } finally {
      setIsLoadingAppointments(false);
    }
  }, [getUserId]);

  // Fetch all schedules
  const fetchSchedules = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setIsLoadingSchedules(false);
      return;
    }

    setIsLoadingSchedules(true);

    try {
      const response = await fetch(`${API_BASE_URL}/schedules`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        console.warn(
          "[fetchSchedules] Failed to fetch schedules:",
          response.status,
        );
        setSchedules([]);
        setIsLoadingSchedules(false);
        return;
      }

      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : data?.data || data?.schedules || data?.items || [];

      // We also need to fetch doctors to enrich the schedule display
      const doctorsResponse = await fetch(`${API_BASE_URL}/doctors`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      const doctorScheduleResponse = await fetch(
        `${API_BASE_URL}/doctor-schedule`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      let doctors = [];
      let doctorSchedules = [];

      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();
        doctors = Array.isArray(doctorsData)
          ? doctorsData
          : doctorsData?.data || doctorsData?.doctors || [];
      }

      if (doctorScheduleResponse.ok) {
        const dsData = await doctorScheduleResponse.json();
        doctorSchedules = Array.isArray(dsData)
          ? dsData
          : dsData?.data || dsData?.doctor_schedules || [];
      }

      // Debug: Log the data to understand the structure
      console.log("[fetchSchedules] schedules:", list);
      console.log("[fetchSchedules] doctorSchedules:", doctorSchedules);
      console.log("[fetchSchedules] doctors:", doctors);

      // Enrich schedules with doctor info
      const enrichedSchedules = list.map((schedule) => {
        // Use loose equality (==) to handle string/number type mismatches
        const ds = doctorSchedules.find(
          (d) => d.schedule_id == schedule.schedule_id,
        );

        // Also try to find doctor directly from schedule if it has doctor_id
        const directDoctorId = schedule.doctor_id || ds?.doctor_id;
        const doctor = directDoctorId
          ? doctors.find((doc) => doc.doctor_id == directDoctorId)
          : null;

        // Debug: Log when we can't find a match
        if (!doctor) {
          console.log(
            `[fetchSchedules] No doctor found for schedule_id=${schedule.schedule_id}, day=${schedule.day}`,
            { ds, directDoctorId, schedule },
          );
        }

        return {
          ...schedule,
          doctor_name: doctor?.doctor_name || null, // Use null instead of "Unknown Doctor"
          doctor_id: directDoctorId || null,
        };
      });

      // Filter out schedules without a valid doctor (no "Unknown Doctor" entries)
      const validSchedules = enrichedSchedules.filter(
        (schedule) => schedule.doctor_name !== null,
      );

      console.log(
        "[fetchSchedules] Valid schedules after filtering:",
        validSchedules,
      );

      setSchedules(validSchedules);
    } catch (err) {
      console.error("[fetchSchedules] Error:", err);
      toast.error("Unable to load appointment data. Please try again.");
    } finally {
      setIsLoadingSchedules(false);
    }
  }, []);

  // Fetch reason categories
  const fetchReasonCategories = useCallback(async () => {
    const token = getAuthToken();
    setIsLoadingReasonCategories(true);

    try {
      const response = await fetch(`${API_BASE_URL}/reason-categories`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reason categories");
      }

      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : data?.data || data?.reason_categories || data?.items || [];

      setReasonCategories(list);
    } catch (err) {
      console.error("[fetchReasonCategories] Error:", err);
      toast.error("Unable to load appointment data. Please try again.");
    } finally {
      setIsLoadingReasonCategories(false);
    }
  }, []);

  // Get schedules filtered by a specific date (weekday)
  const getSchedulesForDate = useCallback(
    (dateString) => {
      if (!dateString) return [];

      const date = new Date(dateString);
      const dayIndex = date.getDay();

      // Check if weekend (0 = Sunday, 6 = Saturday)
      if (dayIndex === 0 || dayIndex === 6) {
        return [];
      }

      const dayAbbrev = DAY_INDEX_TO_ABBREV[dayIndex];

      // Filter schedules that match the day
      return schedules.filter((schedule) => schedule.day === dayAbbrev);
    },
    [schedules],
  );

  // Check if a date is a weekday
  const isWeekday = useCallback((dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const dayIndex = date.getDay();
    return dayIndex !== 0 && dayIndex !== 6;
  }, []);

  // Book an appointment
  const bookAppointment = useCallback(
    async (scheduleId, appointmentDate, appointmentTime, reasonCategoryId) => {
      const token = getAuthToken();
      if (!token) {
        toast.error("You are not authenticated. Please log in again.");
        return false;
      }

      const userId = getUserId();
      if (!userId) {
        toast.error("Unable to determine your user ID.");
        return false;
      }

      setIsBooking(true);

      try {
        const response = await fetch(`${API_BASE_URL}/appointments`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            user_id: userId,
            schedule_id: parseInt(scheduleId),
            appointment_date: appointmentDate,
            appointment_time: appointmentTime,
            reason_category_id: parseInt(reasonCategoryId),
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message = data?.message || "Failed to book appointment";
          toast.error(message);
          return false;
        }

        toast.success(
          "Appointment booked successfully. You are now added to the queue.",
        );

        // Refresh appointments to get the newly created one
        await fetchAppointments();
        return true;
      } catch (err) {
        console.error("[bookAppointment] Error:", err);
        toast.error(err.message || "An error occurred while booking");
        return false;
      } finally {
        setIsBooking(false);
      }
    },
    [getUserId, fetchAppointments],
  );

  // Cancel an appointment
  const cancelAppointment = useCallback(
    async (appointmentId) => {
      const token = getAuthToken();
      if (!token) {
        toast.error("You are not authenticated. Please log in again.");
        return false;
      }

      setIsCancelling(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/appointments/${appointmentId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({
              status: "cancelled",
            }),
          },
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const message = data?.message || "Failed to cancel appointment";
          toast.error(message);
          return false;
        }

        toast.success("Appointment cancelled.");

        // Clear active appointment and refresh
        setActiveAppointment(null);
        await fetchAppointments();
        return true;
      } catch (err) {
        console.error("[cancelAppointment] Error:", err);
        toast.error(err.message || "An error occurred while cancelling");
        return false;
      } finally {
        setIsCancelling(false);
      }
    },
    [fetchAppointments],
  );

  // Initial data fetch
  useEffect(() => {
    fetchAppointments();
    fetchSchedules();
    fetchReasonCategories();
  }, [fetchAppointments, fetchSchedules, fetchReasonCategories]);

  return {
    appointments,
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
    refreshAppointments: fetchAppointments,
    refreshSchedules: fetchSchedules,
    refreshReasonCategories: fetchReasonCategories,
  };
}
