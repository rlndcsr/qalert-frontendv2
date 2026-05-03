"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSystemStatus } from "../hooks/useSystemStatus";
import { useSseEvents } from "../hooks/useSseEvents";
import Image from "next/image";
import DoctorQueueCard from "./queueComponents/DoctorQueueCard";

// Constants
const API_BASE_URL = "/api/proxy";

/** Single canonical display key for a doctor name (avoids duplicate AM/PM cards from spacing / dup rows). */
function normalizeDoctorName(name) {
  if (!name || typeof name !== "string") return "";
  return name.trim().replace(/\s+/g, " ");
}

/** API may return various casings or spacing for queue_status. */
function normalizeQueueStatus(status) {
  return String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/**
 * Doctor + schedule for a queue row: join via appointment when present, else use
 * doctor_id / schedule_id on the row (public display must still route now_serving to a card).
 */
function resolveQueueEntryRouting(
  entry,
  appointmentTimeMap,
  aptScheduleMap,
  aptDoctorMap,
  scheduleShiftMap,
  doctorNameMap,
) {
  let scheduleId =
    entry.appointment_id != null
      ? aptScheduleMap[String(entry.appointment_id)]
      : null;
  if (scheduleId == null && entry.schedule_id != null) {
    scheduleId = String(entry.schedule_id);
  }

  let doctorId =
    entry.appointment_id != null
      ? aptDoctorMap[String(entry.appointment_id)]
      : null;
  if (doctorId == null && entry.doctor_id != null) {
    doctorId = String(entry.doctor_id);
  }

  const shift = scheduleId
    ? scheduleShiftMap[String(scheduleId)] || null
    : null;
  const doctorRaw = doctorId ? doctorNameMap[doctorId] : null;
  let doctor = doctorRaw ? normalizeDoctorName(doctorRaw) || null : null;
  if (!doctor && entry.doctor_name) {
    doctor = normalizeDoctorName(String(entry.doctor_name)) || null;
  }
  const scheduledTime =
    entry.appointment_id != null
      ? appointmentTimeMap[String(entry.appointment_id)] || null
      : null;

  return { scheduleId, doctorId, shift, doctor, scheduledTime };
}

export default function QueueDisplay() {
  const {
    isOnline,
    isLoading: isStatusLoading,
    setIsOnline,
  } = useSystemStatus();
  const router = useRouter();
  useEffect(() => {
    if (!isStatusLoading && !isOnline) {
      router.replace("/");
    }
  }, [isStatusLoading, isOnline, router]);

  // State for client-side time to avoid hydration mismatch
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // State for queue data
  const [queueEntries, setQueueEntries] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // State for emergency encounters
  const [emergencyEncounters, setEmergencyEncounters] = useState([]);
  const previousEmergencyDataRef = useRef(null);

  // Appointment time map for scheduled times
  const [appointmentTimeMap, setAppointmentTimeMap] = useState({});
  const previousAppointmentDataRef = useRef(null);

  // Appointment to schedule mapping
  const [aptScheduleMap, setAptScheduleMap] = useState({});
  const previousAptScheduleRef = useRef(null);
  const [aptDoctorMap, setAptDoctorMap] = useState({});
  const previousAptDoctorRef = useRef(null);

  // Schedule shift and doctor maps
  const [scheduleShiftMap, setScheduleShiftMap] = useState({});
  const [scheduleDoctorMap, setScheduleDoctorMap] = useState({});
  const [doctorNameMap, setDoctorNameMap] = useState({});
  const [shiftDoctorMap, setShiftDoctorMap] = useState({ AM: [], PM: [] });
  const previousSchedulesDataRef = useRef(null);
  const previousScheduleDoctorRef = useRef(null);
  const previousDoctorNameRef = useRef(null);
  const previousShiftDoctorRef = useRef(null);

  // Refs for comparing data to avoid unnecessary re-renders
  const previousQueueDataRef = useRef(null);
  const previousUsersDataRef = useRef(null);

  // Helper to format queue numbers as 3 digits (e.g., 002)
  const formatQueueNumber = (n) => String(n).padStart(3, "0");

  // Helper to get auth token from localStorage
  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") {
      // Try adminToken first (used by admin/authenticated pages), fallback to token
      return (
        localStorage.getItem("adminToken") || localStorage.getItem("token")
      );
    }
    return null;
  }, []);

  // Helper to compare arrays/objects for equality
  const isDataEqual = useCallback((newData, oldData) => {
    if (!oldData) return false;
    return JSON.stringify(newData) === JSON.stringify(oldData);
  }, []);

  // Helper to get today's date in YYYY-MM-DD format (local timezone)
  const getTodayString = useCallback(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Helper to normalize UTC date to local date for comparison
  const normalizeDateToLocal = useCallback((dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Format time string to 12-hour format
  const formatTime = useCallback((timeString) => {
    if (!timeString) return null;
    let hours, minutes;
    if (timeString.includes("T")) {
      const date = new Date(timeString);
      hours = date.getHours();
      minutes = date.getMinutes();
    } else {
      const parts = timeString.split(" ");
      const timePart = parts.length >= 2 ? parts[1] : parts[0];
      const timeParts = timePart.split(":");
      hours = parseInt(timeParts[0], 10);
      minutes = parseInt(timeParts[1], 10);
    }
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = String(minutes).padStart(2, "0");
    return `${hours}:${minutesStr} ${ampm}`;
  }, []);

  // Fetch queue data from public endpoint
  const fetchQueueData = useCallback(
    async (isInitial = false) => {
      try {
        const headers = {
          Accept: "application/json",
          "ngrok-skip-browser-warning": "true",
        };

        const response = await fetch(`${API_BASE_URL}/public/queue-display`, {
          headers,
        });

        if (response.ok) {
          const data = await response.json();

          // queues for today (already filtered by backend)
          const todayQueues = data.queues || [];

          // Handle emergency encounters
          const allEncounters = data.emergency_encounters || [];
          const todayString = getTodayString();
          const todayEncounters = allEncounters.filter((enc) => {
            const encDate = normalizeDateToLocal(enc.date);
            const encStatus = (enc.status || "active").toLowerCase();
            return encDate === todayString && encStatus === "active";
          });
          if (!isDataEqual(todayEncounters, previousEmergencyDataRef.current)) {
            previousEmergencyDataRef.current = todayEncounters;
            setEmergencyEncounters(todayEncounters);
          }

          // Create a user map for quick lookup (id_number only)
          const userMap = {};
          (data.users || []).forEach((user) => {
            userMap[user.user_id] = user;
          });

          // Build appointment time map and appointment-to-schedule map keyed by appointment_id
          const timeMap = {};
          const aptScheduleMap = {};
          const aptDoctorMap = {};
          (data.appointments || []).forEach((apt) => {
            if (apt.appointment_id != null) {
              if (apt.appointment_time)
                timeMap[String(apt.appointment_id)] = apt.appointment_time;
              if (apt.schedule_id != null)
                aptScheduleMap[String(apt.appointment_id)] = String(
                  apt.schedule_id,
                );
              if (apt.doctor_id != null)
                aptDoctorMap[String(apt.appointment_id)] = String(
                  apt.doctor_id,
                );
            }
          });

          // Build schedule shift map keyed by schedule_id
          const shiftMap = {};
          const schedList = data.schedules || [];
          schedList.forEach((sched) => {
            if (sched.schedule_id != null) {
              shiftMap[String(sched.schedule_id)] = sched.shift || null;
            }
          });

          // Build schedule-to-doctor map using doctor_schedule table
          const scheduleDoctorMap = {};
          (data.doctor_schedules || []).forEach((ds) => {
            if (ds.schedule_id != null && ds.doctor_id != null) {
              const schedKey = String(ds.schedule_id);
              if (!scheduleDoctorMap[schedKey]) {
                scheduleDoctorMap[schedKey] = [];
              }
              scheduleDoctorMap[schedKey].push(String(ds.doctor_id));
            }
          });

          // Build doctor name map keyed by doctor_id
          const doctorNameMap = {};
          (data.doctors || []).forEach((doc) => {
            if (doc.doctor_id != null) {
              doctorNameMap[String(doc.doctor_id)] = doc.doctor_name || null;
            }
          });

          // Build AM/PM shift doctor map for today. The same doctor may appear in both
          // AM and PM when they have two schedule rows — each shift lists them separately.
          const shiftDoctorMap = { AM: [], PM: [] };
          if (schedList.length > 0) {
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const todayDay = dayNames[new Date().getDay()];
            schedList.forEach((sched) => {
              if (
                sched.day === todayDay &&
                (sched.shift === "AM" || sched.shift === "PM")
              ) {
                const doctorIds = scheduleDoctorMap[String(sched.schedule_id)];
                if (doctorIds && Array.isArray(doctorIds)) {
                  doctorIds.forEach((doctorId) => {
                    const raw = doctorNameMap[doctorId];
                    const docName = raw ? normalizeDoctorName(raw) : "";
                    if (
                      docName &&
                      !shiftDoctorMap[sched.shift].includes(docName)
                    ) {
                      shiftDoctorMap[sched.shift].push(docName);
                    }
                  });
                }
              }
            });
          }

          // Only update state if data has changed
          if (!isDataEqual(todayQueues, previousQueueDataRef.current)) {
            previousQueueDataRef.current = todayQueues;
            setQueueEntries(todayQueues);
          }

          if (!isDataEqual(userMap, previousUsersDataRef.current)) {
            previousUsersDataRef.current = userMap;
            setUsers(userMap);
          }

          if (!isDataEqual(timeMap, previousAppointmentDataRef.current)) {
            previousAppointmentDataRef.current = timeMap;
            setAppointmentTimeMap(timeMap);
          }

          if (!isDataEqual(aptScheduleMap, previousAptScheduleRef.current)) {
            previousAptScheduleRef.current = aptScheduleMap;
            setAptScheduleMap(aptScheduleMap);
          }

          if (!isDataEqual(aptDoctorMap, previousAptDoctorRef.current)) {
            previousAptDoctorRef.current = aptDoctorMap;
            setAptDoctorMap(aptDoctorMap);
          }

          if (!isDataEqual({ shiftMap }, previousSchedulesDataRef.current)) {
            previousSchedulesDataRef.current = { shiftMap };
            setScheduleShiftMap(shiftMap);
          }

          if (
            !isDataEqual(scheduleDoctorMap, previousScheduleDoctorRef.current)
          ) {
            previousScheduleDoctorRef.current = scheduleDoctorMap;
            setScheduleDoctorMap(scheduleDoctorMap);
          }

          if (!isDataEqual(doctorNameMap, previousDoctorNameRef.current)) {
            previousDoctorNameRef.current = doctorNameMap;
            setDoctorNameMap(doctorNameMap);
          }

          if (!isDataEqual(shiftDoctorMap, previousShiftDoctorRef.current)) {
            previousShiftDoctorRef.current = shiftDoctorMap;
            setShiftDoctorMap(shiftDoctorMap);
          }
        } else {
          console.error("Failed to fetch queue data:", response.status);
        }
      } catch (error) {
        console.error("Error fetching queue data:", error);
      } finally {
        if (isInitial) {
          setIsLoadingData(false);
          setIsInitialLoad(false);
        }
      }
    },
    [isDataEqual, getTodayString, normalizeDateToLocal],
  );

  // Initial fetch — SSE handles subsequent updates
  useEffect(() => {
    fetchQueueData(true);
  }, [fetchQueueData]);

  // SSE: re-fetch when the backend signals a queue, user, or emergency encounter change
  useSseEvents({
    "queue-updated": () => fetchQueueData(false),
    "user-updated": () => fetchQueueData(false),
    "system-status-updated": (data) => setIsOnline(data?.is_online === 1),
    "emergency-encounter-updated": () => fetchQueueData(false),
  });

  // Process queue data
  const { nowServing, called, waiting, noShow, totalInQueue } = useMemo(() => {
    if (queueEntries.length === 0) {
      return {
        nowServing: [],
        called: [],
        waiting: [],
        noShow: [],
        totalInQueue: 0,
      };
    }

    // Filter by status and sort by queue number
    const nowServingEntries = queueEntries
      .filter((entry) => normalizeQueueStatus(entry.queue_status) === "now_serving")
      .sort((a, b) => a.queue_number - b.queue_number);

    const calledEntries = queueEntries
      .filter((entry) => normalizeQueueStatus(entry.queue_status) === "called")
      .sort((a, b) => a.queue_number - b.queue_number);

    const waitingEntries = queueEntries
      .filter((entry) => normalizeQueueStatus(entry.queue_status) === "waiting")
      .sort((a, b) => a.queue_number - b.queue_number);

    const noShowEntries = queueEntries
      .filter((entry) => normalizeQueueStatus(entry.queue_status) === "no_show")
      .sort((a, b) => a.queue_number - b.queue_number);

    // Now serving: all "now_serving" entries (include shift for per-shift doctor cards)
    const nowServingData = nowServingEntries.map((entry) => {
      const { shift, doctor, scheduledTime } = resolveQueueEntryRouting(
        entry,
        appointmentTimeMap,
        aptScheduleMap,
        aptDoctorMap,
        scheduleShiftMap,
        doctorNameMap,
      );
      return {
        number: entry.queue_number,
        name: users[entry.user_id]?.name || "Unknown",
        id_number: users[entry.user_id]?.id_number || "",
        queue_entry_id: entry.queue_entry_id,
        shift,
        doctor,
        scheduledTime,
      };
    });

    // Called: same shape as waiting; shown in doctor cards with blue styling
    const calledData = calledEntries.map((entry, index) => {
      const { scheduleId, doctor, shift, scheduledTime } =
        resolveQueueEntryRouting(
          entry,
          appointmentTimeMap,
          aptScheduleMap,
          aptDoctorMap,
          scheduleShiftMap,
          doctorNameMap,
        );
      const aptTime = scheduledTime;
      const allDoctorIds = scheduleId
        ? scheduleDoctorMap[scheduleId] || null
        : null;
      const doctors =
        allDoctorIds && Array.isArray(allDoctorIds)
          ? allDoctorIds.map((id) => doctorNameMap[id] || null).filter(Boolean)
          : [];
      return {
        number: entry.queue_number,
        name: users[entry.user_id]?.name || "Unknown",
        id_number: users[entry.user_id]?.id_number || "",
        wait: entry.estimated_time_wait || `~${(index + 1) * 10}m`,
        scheduledTime: aptTime || null,
        shift,
        doctor,
        doctors,
        queueStatus: "called",
      };
    });

    // Waiting: all "waiting" entries
    const waitingData = waitingEntries.map((entry, index) => {
      const { scheduleId, doctor, shift, scheduledTime } =
        resolveQueueEntryRouting(
          entry,
          appointmentTimeMap,
          aptScheduleMap,
          aptDoctorMap,
          scheduleShiftMap,
          doctorNameMap,
        );
      const aptTime = scheduledTime;
      // scheduleDoctorMap[schedule_id] -> array of all doctor_ids for this schedule
      const allDoctorIds = scheduleId
        ? scheduleDoctorMap[scheduleId] || null
        : null;
      // Get all doctor names for this schedule (for display purposes)
      const doctors =
        allDoctorIds && Array.isArray(allDoctorIds)
          ? allDoctorIds.map((id) => doctorNameMap[id] || null).filter(Boolean)
          : [];
      return {
        number: entry.queue_number,
        name: users[entry.user_id]?.name || "Unknown",
        id_number: users[entry.user_id]?.id_number || "",
        wait: entry.estimated_time_wait || `~${(index + 1) * 10}m`,
        scheduledTime: aptTime || null,
        shift,
        doctor,
        doctors, // All doctors for this queue entry
        queueStatus: "waiting",
      };
    });

    // No-show: same shape as waiting; shown in doctor cards with distinct styling
    const noShowData = noShowEntries.map((entry, index) => {
      const { scheduleId, doctor, shift, scheduledTime } =
        resolveQueueEntryRouting(
          entry,
          appointmentTimeMap,
          aptScheduleMap,
          aptDoctorMap,
          scheduleShiftMap,
          doctorNameMap,
        );
      const aptTime = scheduledTime;
      const allDoctorIds = scheduleId
        ? scheduleDoctorMap[scheduleId] || null
        : null;
      const doctors =
        allDoctorIds && Array.isArray(allDoctorIds)
          ? allDoctorIds.map((id) => doctorNameMap[id] || null).filter(Boolean)
          : [];
      return {
        number: entry.queue_number,
        name: users[entry.user_id]?.name || "Unknown",
        id_number: users[entry.user_id]?.id_number || "",
        wait: entry.estimated_time_wait || `~${(index + 1) * 10}m`,
        scheduledTime: aptTime || null,
        shift,
        doctor,
        doctors,
        queueStatus: "no_show",
      };
    });

    // Total in queue (now_serving + called + waiting)
    const total =
      nowServingEntries.length + calledEntries.length + waitingEntries.length;

    return {
      nowServing: nowServingData,
      called: calledData,
      waiting: waitingData,
      noShow: noShowData,
      totalInQueue: total,
    };
  }, [
    queueEntries,
    users,
    appointmentTimeMap,
    aptScheduleMap,
    aptDoctorMap,
    scheduleShiftMap,
    scheduleDoctorMap,
    doctorNameMap,
  ]);

  // Group queues by doctor + shift (two cards when a doctor has AM and PM schedules)
  const doctorQueues = useMemo(() => {
    if (isLoadingData) return [];

    const cardKey = (name, shift) =>
      `${normalizeDoctorName(name)}\u0000${shift}`;

    /** @type {Record<string, { name: string, shift: string, nowServing: object | null, waiting: object[] }>} */
    const doctorMap = {};

    const ensureCard = (docName, shift) => {
      const canonical = normalizeDoctorName(docName);
      if (!canonical) return null;
      if (shift !== "AM" && shift !== "PM") return null;
      const key = cardKey(canonical, shift);
      if (!doctorMap[key]) {
        doctorMap[key] = {
          name: canonical,
          shift,
          nowServing: null,
          waiting: [],
        };
      }
      return doctorMap[key];
    };

    // Roster: one card per (doctor, shift) scheduled today
    const rosterNames = new Set([
      ...(shiftDoctorMap.AM || []),
      ...(shiftDoctorMap.PM || []),
    ]);
    rosterNames.forEach((docName) => {
      const n = normalizeDoctorName(docName);
      if (!n) return;
      if (shiftDoctorMap.AM?.includes(n)) ensureCard(n, "AM");
      if (shiftDoctorMap.PM?.includes(n)) ensureCard(n, "PM");
    });

    // Doctors only seen in queue data (no roster row): infer shift from appointments
    const extraNames = new Set();
    waiting.forEach((w) => {
      if (w.doctor) extraNames.add(w.doctor);
    });
    called.forEach((c) => {
      if (c.doctor) extraNames.add(c.doctor);
    });
    noShow.forEach((n) => {
      if (n.doctor) extraNames.add(n.doctor);
    });
    nowServing.forEach((p) => {
      if (p.doctor) extraNames.add(p.doctor);
    });
    extraNames.forEach((docName) => {
      if (rosterNames.has(docName)) return;
      const shifts = new Set();
      waiting.forEach((w) => {
        if (w.doctor === docName && (w.shift === "AM" || w.shift === "PM")) {
          shifts.add(w.shift);
        }
      });
      called.forEach((c) => {
        if (c.doctor === docName && (c.shift === "AM" || c.shift === "PM")) {
          shifts.add(c.shift);
        }
      });
      noShow.forEach((n) => {
        if (n.doctor === docName && (n.shift === "AM" || n.shift === "PM")) {
          shifts.add(n.shift);
        }
      });
      nowServing.forEach((p) => {
        if (p.doctor === docName && (p.shift === "AM" || p.shift === "PM")) {
          shifts.add(p.shift);
        }
      });
      shifts.forEach((sh) => ensureCard(docName, sh));
      if (shifts.size === 0) {
        ensureCard(docName, "AM");
      }
    });

    // Assign now serving to the card that matches appointment shift
    nowServing.forEach((patient) => {
      const docName = patient.doctor;
      if (!docName) return;
      const sh =
        patient.shift === "AM" || patient.shift === "PM" ? patient.shift : null;
      if (sh) {
        const card = ensureCard(docName, sh);
        if (card) card.nowServing = patient;
      } else {
        const am = doctorMap[cardKey(docName, "AM")];
        const pm = doctorMap[cardKey(docName, "PM")];
        if (am && !pm) am.nowServing = patient;
        else if (pm && !am) pm.nowServing = patient;
        else if (am) am.nowServing = patient;
      }
    });

    // Assign waiting to the card that matches appointment shift
    waiting.forEach((patient) => {
      const docName = patient.doctor || "Unknown";
      const sh =
        patient.shift === "AM" || patient.shift === "PM" ? patient.shift : null;
      if (sh) {
        const card = ensureCard(docName, sh);
        if (card) card.waiting.push(patient);
        return;
      }
      const am = doctorMap[cardKey(docName, "AM")];
      const pm = doctorMap[cardKey(docName, "PM")];
      if (am && !pm) am.waiting.push(patient);
      else if (pm && !am) pm.waiting.push(patient);
      else if (am) am.waiting.push(patient);
    });

    // Called entries — same routing as waiting (blue styling in card)
    called.forEach((patient) => {
      const docName = patient.doctor || "Unknown";
      const sh =
        patient.shift === "AM" || patient.shift === "PM" ? patient.shift : null;
      if (sh) {
        const card = ensureCard(docName, sh);
        if (card) card.waiting.push(patient);
        return;
      }
      const am = doctorMap[cardKey(docName, "AM")];
      const pm = doctorMap[cardKey(docName, "PM")];
      if (am && !pm) am.waiting.push(patient);
      else if (pm && !am) pm.waiting.push(patient);
      else if (am) am.waiting.push(patient);
    });

    // No-show entries use the same routing as waiting (shown with distinct styling in the card)
    noShow.forEach((patient) => {
      const docName = patient.doctor || "Unknown";
      const sh =
        patient.shift === "AM" || patient.shift === "PM" ? patient.shift : null;
      if (sh) {
        const card = ensureCard(docName, sh);
        if (card) card.waiting.push(patient);
        return;
      }
      const am = doctorMap[cardKey(docName, "AM")];
      const pm = doctorMap[cardKey(docName, "PM")];
      if (am && !pm) am.waiting.push(patient);
      else if (pm && !am) pm.waiting.push(patient);
      else if (am) am.waiting.push(patient);
    });

    Object.keys(doctorMap).forEach((k) => {
      doctorMap[k].waiting.sort((a, b) => a.number - b.number);
    });

    const keys = Object.keys(doctorMap);
    const shiftOrder = (s) => (s === "AM" ? 0 : s === "PM" ? 1 : 2);
    keys.sort((a, b) => {
      const A = doctorMap[a];
      const B = doctorMap[b];
      const byShift = shiftOrder(A.shift) - shiftOrder(B.shift);
      if (byShift !== 0) return byShift;
      return A.name.localeCompare(B.name);
    });
    return keys.map((k) => doctorMap[k]);
  }, [nowServing, waiting, called, noShow, isLoadingData, shiftDoctorMap]);

  // Doctor card grid: ≤3 cards fill one row when possible; >3 uses 3 columns so extras wrap to row 2+
  const doctorGridColsClass = useMemo(() => {
    if (isLoadingData) return "md:grid-cols-3";
    const n = doctorQueues.length;
    if (n > 3) return "md:grid-cols-3";
    if (n <= 1) return "md:grid-cols-1";
    if (n === 2) return "md:grid-cols-2";
    return "md:grid-cols-3";
  }, [doctorQueues.length, isLoadingData]);

  // Update time only on client side after mount
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(
        d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
      const day = d.getDate();
      const month = d.toLocaleDateString("en-US", { month: "short" });
      setCurrentDate(`${day} ${month}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-3 md:p-4 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center overflow-hidden">
              <Image
                src="/images/csuuchw-nobg.png"
                alt="CSU-UCHW Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">
                CSU-UCHW Live Queue
              </h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 bg-white/95 px-3 md:px-4 py-1.5 md:py-2 rounded-xl shadow-sm border border-slate-300/70">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 md:w-5 md:h-5"
            style={{ color: "#374D6C" }}
          >
            <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
          </svg>
          <div>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium">
              Total
            </p>
            {isLoadingData ? (
              <div className="h-[28px] md:h-[32px] w-8 bg-slate-200 rounded animate-pulse"></div>
            ) : (
              <p
                className="text-lg md:text-xl font-bold"
                style={{ color: "#374D6C" }}
              >
                {totalInQueue}
              </p>
            )}
          </div>
          <div className="ml-2 md:ml-3 text-right">
            {isLoadingData ? (
              <div className="animate-pulse space-y-1">
                <div className="h-[16px] md:h-[20px] w-12 bg-slate-200 rounded ml-auto"></div>
                <div className="h-[12px] md:h-[14px] w-16 bg-slate-200 rounded ml-auto"></div>
              </div>
            ) : (
              <>
                <p className="text-xs md:text-sm font-semibold text-gray-700">
                  {currentTime}
                </p>
                <p className="text-[10px] md:text-xs text-gray-500">
                  {currentDate}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content: doctor grid — column count depends on number of doctor cards */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div
          className={`flex-1 overflow-y-auto grid grid-cols-1 ${doctorGridColsClass} p-1 ${doctorQueues.length > 3 ? "gap-2 md:gap-2.5" : "gap-3 md:gap-4"}`}
        >
          {isLoadingData ? (
            // Loading state: show skeleton cards
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <DoctorQueueCard
                  key={`skeleton-${i}`}
                  doctorName={`Doctor ${i}`}
                  doctorId={i}
                  shift={i % 2 === 0 ? "AM" : "PM"}
                  nowServingPatient={null}
                  waitingPatients={[]}
                  formatQueueNumber={formatQueueNumber}
                  formatTime={formatTime}
                  isLoading={true}
                  compact={doctorQueues.length > 3}
                />
              ))}
            </>
          ) : doctorQueues.length === 0 ? (
            // No doctors scheduled
            <div className="col-span-full flex items-center justify-center h-full min-h-[200px]">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-8 h-8 text-gray-400"
                  >
                    <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">
                  No health personnel scheduled for today
                </p>
              </div>
            </div>
          ) : (
            // Doctor cards
            doctorQueues.map((doctor) => (
              <DoctorQueueCard
                key={`${doctor.name}-${doctor.shift}`}
                doctorName={doctor.name}
                doctorId={`${doctor.name}-${doctor.shift}`}
                shift={doctor.shift}
                nowServingPatient={doctor.nowServing}
                waitingPatients={doctor.waiting}
                formatQueueNumber={formatQueueNumber}
                formatTime={formatTime}
                isLoading={false}
                compact={doctorQueues.length > 3}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
