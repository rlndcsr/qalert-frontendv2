"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { sileo } from "sileo";
import { useSseEvents } from "../../hooks/useSseEvents";

const API_BASE_URL = "/api/proxy";

const formatTime = (timeString) => {
  if (!timeString) return "—";
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
};

const panelQueuesKey = (doctorId, scheduleId) =>
  scheduleId ? `${doctorId}:${scheduleId}` : String(doctorId);

export default function DoctorQueuePanels({ setQueues }) {
  const [queueEntries, setQueueEntries] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Appointment time map keyed by appointment_id
  const [appointmentTimeMap, setAppointmentTimeMap] = useState({});
  // Appointment to doctor_id map keyed by appointment_id
  const [aptDoctorMap, setAptDoctorMap] = useState({});
  // Appointment to schedule_id map keyed by appointment_id
  const [aptScheduleMap, setAptScheduleMap] = useState({});
  // Schedule shift map keyed by schedule_id → "AM" | "PM"
  const [scheduleShiftMap, setScheduleShiftMap] = useState({});
  // Doctor name map keyed by doctor_id
  const [doctorNameMap, setDoctorNameMap] = useState({});
  // Schedule doctor map keyed by schedule_id → [doctor_id, ...]
  const [scheduleDoctorMap, setScheduleDoctorMap] = useState({});

  // Reason category map keyed by reason_category_id
  const [reasonCategoryMap, setReasonCategoryMap] = useState({});

  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("adminToken");
    }
    return null;
  }, []);

  const getTodayDayName = useCallback(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return dayNames[new Date().getDay()];
  }, []);

  // Raw API data for derived computations
  const [apiData, setApiData] = useState({
    schedules: [],
    doctor_schedules: [],
    doctors: [],
    reason_categories: [],
  });

  const fetchQueueData = useCallback(async () => {
    try {
      const headers = {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      };

      const response = await fetch(`${API_BASE_URL}/public/queue-display`, {
        headers,
      });

      if (!response.ok) throw new Error("Failed to fetch queue data");

      const data = await response.json();

      // Build user map
      const userMap = {};
      (data.users || []).forEach((u) => {
        userMap[u.user_id] = u;
      });
      setUsers(userMap);

      // Build appointment time map and appointment→doctor map and appointment→schedule map
      const timeMap = {};
      const docMap = {};
      const shiftMap = {};
      const schedMap = {};
      (data.appointments || []).forEach((apt) => {
        if (apt.appointment_id != null) {
          if (apt.appointment_time)
            timeMap[String(apt.appointment_id)] = apt.appointment_time;
          if (apt.doctor_id != null)
            docMap[String(apt.appointment_id)] = String(apt.doctor_id);
          if (apt.schedule_id != null)
            schedMap[String(apt.appointment_id)] = String(apt.schedule_id);
        }
      });
      (data.schedules || []).forEach((s) => {
        if (s.schedule_id != null) shiftMap[String(s.schedule_id)] = s.shift;
      });
      setAppointmentTimeMap(timeMap);
      setAptDoctorMap(docMap);
      setAptScheduleMap(schedMap);
      setScheduleShiftMap(shiftMap);

      // Build schedule→doctor map
      const schedDocMap = {};
      (data.doctor_schedules || []).forEach((ds) => {
        if (ds.schedule_id != null && ds.doctor_id != null) {
          const key = String(ds.schedule_id);
          if (!schedDocMap[key]) schedDocMap[key] = [];
          schedDocMap[key].push(String(ds.doctor_id));
        }
      });
      setScheduleDoctorMap(schedDocMap);

      // Build doctor name map
      const docNameMap = {};
      (data.doctors || []).forEach((d) => {
        if (d.doctor_id != null)
          docNameMap[String(d.doctor_id)] = d.doctor_name;
      });
      setDoctorNameMap(docNameMap);

      // Store raw API data for derived computations
      setApiData({
        schedules: data.schedules || [],
        doctor_schedules: data.doctor_schedules || [],
        doctors: data.doctors || [],
        reason_categories: data.reason_categories || [],
      });

      // Build reason category map from public API data
      const rcMap = {};
      (data.reason_categories || []).forEach((c) => {
        if (c.reason_category_id) rcMap[c.reason_category_id] = c.name;
      });
      setReasonCategoryMap(rcMap);

      setQueueEntries(data.queues || []);
    } catch (err) {
      console.error("Error fetching queue data:", err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  useSseEvents({
    "queue-updated": () => fetchQueueData(),
  });

  // One row per doctor schedule slot today (same doctor can appear for AM and PM)
  const doctorsWithScheduleToday = useMemo(() => {
    const todayDay = getTodayDayName();
    const daySchedules = apiData.schedules.filter((s) => s.day === todayDay);

    const entries = [];
    daySchedules.forEach((sched) => {
      const schedKey = String(sched.schedule_id);
      const docs = scheduleDoctorMap[schedKey] || [];
      docs.forEach((d) => {
        entries.push({
          doctorId: d,
          doctorName: doctorNameMap[d] || "Unknown Doctor",
          shift: sched.shift || null,
          scheduleId: schedKey,
        });
      });
    });

    return entries;
  }, [apiData.schedules, scheduleDoctorMap, doctorNameMap, getTodayDayName]);

  // Group queues by doctor + schedule (matches appointment schedule_id)
  const queuesByDoctorSchedule = useMemo(() => {
    const grouped = {};
    queueEntries.forEach((entry) => {
      const doctorId = aptDoctorMap[String(entry.appointment_id)] || null;
      if (!doctorId) return;
      const scheduleId = aptScheduleMap[String(entry.appointment_id)] || null;
      const key = panelQueuesKey(doctorId, scheduleId);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    });
    return grouped;
  }, [queueEntries, aptDoctorMap, aptScheduleMap]);

  // Actions
  const handleCallPatient = async (queue) => {
    const token = getAuthToken();
    if (!token) {
      sileo.error({
        title: "Authentication required",
        description: "Please log in again.",
      });
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/queues/status/${queue.queue_entry_id}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ queue_status: "called" }),
        },
      );

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}`;
        try {
          const errBody = await response.json();
          errorDetail =
            errBody?.message ||
            errBody?.error ||
            (typeof errBody === "string" ? errBody : errorDetail);
        } catch {
          const text = await response.text().catch(() => "");
          console.error("[Call] API error text:", text);
        }
        throw new Error(`Failed to update queue status: ${errorDetail}`);
      }

      const patient = users[queue.user_id] || {};
      const digits = (patient.phone_number || "").replace(/\D/g, "");
      let recipient;
      if (digits.startsWith("63")) {
        recipient = `+${digits}`;
      } else if (digits.startsWith("0")) {
        recipient = `+63${digits.slice(1)}`;
      } else {
        recipient = `+63${digits}`;
      }

      const qDoctor = aptDoctorMap[String(queue.appointment_id)];
      const qSched = aptScheduleMap[String(queue.appointment_id)] || null;
      const sortedQueues = [
        ...(queuesByDoctorSchedule[panelQueuesKey(qDoctor, qSched)] || []),
      ].sort((a, b) => a.queue_number - b.queue_number);
      const position =
        sortedQueues.findIndex(
          (q) => q.queue_entry_id === queue.queue_entry_id,
        ) + 1;

      const queueNum = String(queue.queue_number).padStart(3, "0");
      const aptTime = appointmentTimeMap[String(queue.appointment_id)];
      const aptTimeFormatted = aptTime ? formatTime(aptTime) : "N/A";
      const reason =
        reasonCategoryMap[queue.reason_category_id] || queue.reason || "N/A";
      const message = `CSU UCHW:\n\nYou are now called for your appointment scheduled at ${aptTimeFormatted} for ${reason}. You are currently #${position} in the queue. Please proceed to the university clinic immediately. You have 10 minutes before the next patient is called.\n\nWe encourage you to arrive as early as possible. Thank you.`;

      const smsPromise = fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: recipient, text: message }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success)
          throw new Error(
            data?.details?.message ||
              data?.details?.error ||
              (typeof data?.details === "string" ? data.details : null) ||
              data?.error ||
              "Failed to send SMS",
          );
      });

      // Immediately update local state — backend status is already "called"
      setQueueEntries((prev) =>
        prev.map((q) =>
          q.queue_entry_id === queue.queue_entry_id
            ? { ...q, queue_status: "called" }
            : q,
        ),
      );
      setQueues((prevQueues) =>
        prevQueues.map((q) =>
          q.queue_entry_id === queue.queue_entry_id
            ? { ...q, queue_status: "called" }
            : q,
        ),
      );

      sileo.promise(smsPromise, {
        loading: {
          title: "Sending SMS…",
          description: `Sending notification to ${recipient}`,
        },
        success: {
          title: "Patient called",
          description: `SMS notification sent to ${patient.name || "the patient"}.`,
        },
        error: {
          title: "SMS failed",
          description: `Queue #${String(queue.queue_number).padStart(3, "0")} called but SMS could not be sent.`,
        },
      });

      await smsPromise;
    } catch (error) {
      console.error("Error calling patient:", error);
      sileo.error({
        title: "Call failed",
        description:
          error.message || "Failed to call patient. Please try again.",
      });
    }
  };

  const handleCompletePatient = async (queue) => {
    const token = getAuthToken();
    if (!token) {
      sileo.error({
        title: "Authentication required",
        description: "Please log in again.",
      });
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/queues/status/${queue.queue_entry_id}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ queue_status: "completed" }),
        },
      );
      if (!response.ok) throw new Error("Failed to update queue status");

      setQueueEntries((prev) =>
        prev.map((q) =>
          q.queue_entry_id === queue.queue_entry_id
            ? { ...q, queue_status: "completed" }
            : q,
        ),
      );
      setQueues((prevQueues) =>
        prevQueues.map((q) =>
          q.queue_entry_id === queue.queue_entry_id
            ? { ...q, queue_status: "completed" }
            : q,
        ),
      );
      sileo.success({
        title: "Queue completed",
        description: `Queue #${String(queue.queue_number).padStart(3, "0")} marked as completed.`,
      });
    } catch (error) {
      console.error("Error completing patient:", error);
      sileo.error({
        title: "Update failed",
        description: "Failed to complete patient.",
      });
    }
  };

  const handleArrived = async (queue) => {
    const token = getAuthToken();
    if (!token) {
      sileo.error({
        title: "Authentication required",
        description: "Please log in again.",
      });
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/queues/status/${queue.queue_entry_id}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ queue_status: "now_serving" }),
        },
      );
      if (!response.ok) throw new Error("Failed to update queue status");

      setQueueEntries((prev) =>
        prev.map((q) =>
          q.queue_entry_id === queue.queue_entry_id
            ? { ...q, queue_status: "now_serving" }
            : q,
        ),
      );
      setQueues((prevQueues) =>
        prevQueues.map((q) =>
          q.queue_entry_id === queue.queue_entry_id
            ? { ...q, queue_status: "now_serving" }
            : q,
        ),
      );
      sileo.success({
        title: "Patient Arrived",
        description: `Queue #${String(queue.queue_number).padStart(3, "0")} is now being served.`,
      });
    } catch (error) {
      console.error("Error marking patient as arrived:", error);
      sileo.error({
        title: "Update failed",
        description: "Failed to mark patient as arrived.",
      });
    }
  };

  const handleNoShow = async (queue) => {
    const token = getAuthToken();
    if (!token) {
      sileo.error({
        title: "Authentication required",
        description: "Please log in again.",
      });
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/queues/status/${queue.queue_entry_id}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ queue_status: "no_show" }),
        },
      );
      if (!response.ok) throw new Error("Failed to update queue status");

      setQueueEntries((prev) =>
        prev.map((q) =>
          q.queue_entry_id === queue.queue_entry_id
            ? { ...q, queue_status: "no_show" }
            : q,
        ),
      );
      setQueues((prevQueues) =>
        prevQueues.map((q) =>
          q.queue_entry_id === queue.queue_entry_id
            ? { ...q, queue_status: "no_show" }
            : q,
        ),
      );
      sileo.success({
        title: "No Show",
        description: `Queue #${String(queue.queue_number).padStart(3, "0")} marked as no-show.`,
      });
    } catch (error) {
      console.error("Error marking patient as no-show:", error);
      sileo.error({
        title: "Update failed",
        description: "Failed to mark patient as no-show.",
      });
    }
  };

  const getAppointmentTime = (queue) => {
    if (!queue.appointment_id) return "—";
    const time = appointmentTimeMap[String(queue.appointment_id)];
    return time ? formatTime(time) : "—";
  };

  // Sort queues by appointment time within a doctor's panel
  const sortQueuesByTime = (queues) => {
    return [...queues].sort((a, b) => {
      const timeA = appointmentTimeMap[String(a.appointment_id)] || "";
      const timeB = appointmentTimeMap[String(b.appointment_id)] || "";
      if (timeA && timeB) return timeA.localeCompare(timeB);
      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;
      return a.queue_number - b.queue_number;
    });
  };

  const getStatusBadge = (status) => {
    const s = status.toLowerCase();
    if (s === "waiting")
      return { class: "bg-yellow-100 text-yellow-700", label: "Waiting" };
    if (s === "called")
      return { class: "bg-blue-100 text-blue-700", label: "Called" };
    if (s === "now_serving")
      return { class: "bg-green-100 text-green-700", label: "Now Serving" };
    if (s === "completed")
      return {
        class: "bg-white text-gray-700 border border-gray-300",
        label: "Completed",
      };
    if (s === "cancelled")
      return { class: "bg-red-100 text-red-700", label: "Cancelled" };
    if (s === "no_show")
      return { class: "bg-amber-100 text-amber-700", label: "No Show" };
    return { class: "bg-gray-100 text-gray-700", label: status };
  };

  const statusBadge = (status) => {
    const { class: cls, label } = getStatusBadge(status);
    return (
      <span
        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${cls}`}
      >
        {label}
      </span>
    );
  };

  const totalWaiting = (queues) =>
    queues.filter((q) => q.queue_status.toLowerCase() === "waiting").length;

  return (
    <div>
      {/* Section Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-[#25323A]">
            Queue Management
          </h2>
          <p className="text-sm text-gray-600">
            Manage patient flow per health personnel
          </p>
        </div>
      </div>

      {/* Doctor Panels Grid */}
      {isLoadingData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="relative overflow-hidden bg-white/95 rounded-2xl shadow-sm border border-[#00968a]/20"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#00968a] via-[#11b3a6] to-[#00968a]" />
              <div className="p-5">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div
                      key={j}
                      className="h-12 bg-gray-100 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : doctorsWithScheduleToday.length === 0 ? (
        <div className="bg-white/95 rounded-2xl shadow-sm border border-[#00968a]/20 p-12 text-center">
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
      ) : (
        <div className="space-y-8">
          {["AM", "PM"].map((shiftLabel) => {
            const shiftDoctors = doctorsWithScheduleToday.filter(
              (d) => d.shift === shiftLabel,
            );
            if (shiftDoctors.length === 0) return null;
            return (
              <div key={shiftLabel}>
                {/* Shift Divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00968a] to-[#11b3a6] text-white">
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {shiftLabel}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-[#00968a]/30 to-transparent" />
                </div>

                {/* Doctor Panels Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {shiftDoctors.map(({ doctorId, doctorName, scheduleId }) => {
                    const doctorQueues = sortQueuesByTime(
                      queuesByDoctorSchedule[
                        panelQueuesKey(doctorId, scheduleId)
                      ] || [],
                    ).filter(
                      (q) => q.queue_status.toLowerCase() !== "completed",
                    );
                    const waitingCount = totalWaiting(doctorQueues);

                    return (
                      <motion.div
                        key={`${doctorId}-${scheduleId}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="relative overflow-hidden bg-white/95 rounded-2xl shadow-sm border border-[#00968a]/20 flex flex-col max-h-[520px]"
                      >
                        {/* Top accent bar */}
                        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#00968a] via-[#11b3a6] to-[#00968a]" />

                        {/* Panel Header */}
                        <div className="p-5 pb-4 border-b border-gray-100 flex-shrink-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-3">
                              <h3
                                className="text-sm font-semibold text-[#25323A] truncate"
                                title={doctorName}
                              >
                                {doctorName}
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {doctorQueues.length === 0
                                  ? "No patients"
                                  : `${doctorQueues.length} total`}
                                {waitingCount > 0 && (
                                  <span className="text-[#00968a] font-medium">
                                    {" "}
                                    · {waitingCount} waiting
                                  </span>
                                )}
                              </p>
                            </div>
                            {waitingCount > 0 && (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#00968a] text-white text-xs font-bold shadow-sm flex-shrink-0">
                                {waitingCount}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Queue Table */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                          {doctorQueues.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 px-4">
                              <p className="text-xs text-gray-400 text-center">
                                No queue entries
                              </p>
                            </div>
                          ) : (
                            <table className="w-full">
                              <thead className="bg-slate-50 border-b border-gray-100 sticky top-0">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    No.
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Patient
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Contact
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Time
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Status
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Action
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {doctorQueues.map((queue) => {
                                  const patient = users[queue.user_id] || {};
                                  const status =
                                    queue.queue_status.toLowerCase();
                                  const badge = getStatusBadge(
                                    queue.queue_status,
                                  );

                                  return (
                                    <tr
                                      key={queue.queue_entry_id}
                                      className="hover:bg-slate-50/60 transition-colors"
                                    >
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="text-xs font-semibold text-[#25323A]">
                                          {String(queue.queue_number).padStart(
                                            3,
                                            "0",
                                          )}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-xs font-medium text-[#25323A] truncate">
                                          {patient.name || "Unknown"}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">
                                          {patient.id_number || ""}
                                        </p>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <p className="text-xs text-gray-600 truncate">
                                          {patient.phone_number || "—"}
                                        </p>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="text-xs text-gray-600">
                                          {getAppointmentTime(queue)}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <span
                                          className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${badge.class}`}
                                        >
                                          {badge.label}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex flex-wrap gap-1">
                                          {status === "waiting" && (
                                            <button
                                              onClick={() =>
                                                handleCallPatient(queue)
                                              }
                                              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors hover:cursor-pointer"
                                            >
                                              Call
                                            </button>
                                          )}
                                          {status === "called" && (
                                            <button
                                              onClick={() =>
                                                handleArrived(queue)
                                              }
                                              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-md transition-colors hover:cursor-pointer"
                                            >
                                              Arrived
                                            </button>
                                          )}
                                          {status === "now_serving" && (
                                            <button
                                              onClick={() =>
                                                handleCompletePatient(queue)
                                              }
                                              className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-md transition-colors hover:cursor-pointer"
                                            >
                                              Done
                                            </button>
                                          )}
                                          {status === "no_show" && (
                                            <button
                                              onClick={() =>
                                                handleArrived(queue)
                                              }
                                              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-md transition-colors hover:cursor-pointer"
                                            >
                                              Arrived
                                            </button>
                                          )}
                                          {(status === "called" ||
                                            status === "now_serving") && (
                                            <button
                                              onClick={() =>
                                                handleNoShow(queue)
                                              }
                                              className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium rounded-md transition-colors hover:cursor-pointer"
                                            >
                                              No Show
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
