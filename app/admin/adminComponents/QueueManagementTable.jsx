"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { sileo } from "sileo";

const API_BASE_URL =
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

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

export default function QueueManagementTable({
  todayQueues,
  todayDate,
  userMap,
  isFetchingData,
  setQueues,
  setCalledPatients,
  users,
}) {
  const handleCallPatient = async (queue) => {
    const token = localStorage.getItem("adminToken");
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
            "ngrok-skip-browser-warning": true,
          },
          body: JSON.stringify({ queue_status: "called" }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update queue status");
      }

      // Send SMS via new API
      const patient = userMap[queue.user_id] || {};
      // Strip all non-digit characters, then normalize to E.164 (+63XXXXXXXXX)
      const digits = (patient.phone_number || "").replace(/\D/g, "");
      let recipient;
      if (digits.startsWith("63")) {
        recipient = `+${digits}`;
      } else if (digits.startsWith("0")) {
        recipient = `+63${digits.slice(1)}`;
      } else {
        recipient = `+63${digits}`;
      }

      const sortedQueues = [...todayQueues].sort(
        (a, b) => a.queue_number - b.queue_number,
      );
      const position =
        sortedQueues.findIndex(
          (q) => q.queue_entry_id === queue.queue_entry_id,
        ) + 1;

      const queueNum = String(queue.queue_number).padStart(3, "0");
      const aptTime = queue.appointment_id
        ? appointmentTimeMap[queue.appointment_id]
        : null;
      const aptTimeFormatted = aptTime ? formatTime(aptTime) : "N/A";
      const reason =
        reasonCategoryMap[queue.reason_category_id] || queue.reason || "N/A";
      const message = `CSU UCHW:\n\nYou are now called for your appointment scheduled at ${aptTimeFormatted} for ${reason}. You are currently #${position} in the queue. Please proceed to the university clinic immediately. You have 10 minutes before the next patient is called.\n\nWe encourage you to arrive as early as possible. Thank you.`;

      console.log("[SMS] Sending to recipient:", recipient);
      console.log("[SMS] Message:", message);

      const smsPromise = fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: recipient, text: message }),
      }).then(async (res) => {
        const data = await res.json();
        console.log(
          "[SMS] Response status:",
          res.status,
          "| body:",
          JSON.stringify(data),
        );
        if (!res.ok || !data.success)
          throw new Error(
            data?.details?.message ||
              data?.details?.error ||
              (typeof data?.details === "string" ? data.details : null) ||
              data?.error ||
              "Failed to send SMS",
          );
      });

      sileo.promise(smsPromise, {
        loading: {
          title: "Sending SMS…",
          description: `Sending notification to ${recipient}`,
        },
        success: {
          title: "Patient called",
          description: `SMS sent for queue #${String(queue.queue_number).padStart(3, "0")}`,
        },
        error: {
          title: "SMS failed",
          description: "Queue status updated but SMS could not be sent.",
        },
      });

      // Wait for SMS to succeed before moving to called patients
      await smsPromise;

      setQueues((prevQueues) =>
        prevQueues.map((q) =>
          q.queue_entry_id === queue.queue_entry_id
            ? { ...q, queue_status: "called" }
            : q,
        ),
      );
    } catch (error) {
      console.error("Error calling patient:", error);
      sileo.error({
        title: "Call failed",
        description: "Failed to call patient. Please try again.",
      });
    }
  };

  const handleTestSms = async (user) => {
    const digits = (user.phone_number || "").replace(/\D/g, "");
    let recipient;
    if (digits.startsWith("63")) {
      recipient = `+${digits}`;
    } else if (digits.startsWith("0")) {
      recipient = `+63${digits.slice(1)}`;
    } else {
      recipient = `+63${digits}`;
    }

    const message = `QAlert Test: Hello ${user.name}, this is a test message from QAlert SMS API.`;

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

    sileo.promise(smsPromise, {
      loading: {
        title: "Sending test SMS…",
        description: `Sending to ${recipient}`,
      },
      success: {
        title: "Test SMS sent",
        description: `Message delivered to ${user.name}`,
      },
      error: {
        title: "SMS failed",
        description: "Could not send test message.",
      },
    });
  };

  const handleCompletePatient = (queue) => {
    console.log("Complete patient:", queue);
    sileo.success({
      title: "Queue completed",
      description: `Completed queue #${queue.queue_number}`,
    });
  };

  // Fetch reason categories and today's appointments for lookups
  const [reasonCategoryMap, setReasonCategoryMap] = useState({});
  // appointmentMap: keyed by appointment_id → appointment_time
  const [appointmentTimeMap, setAppointmentTimeMap] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
    };
    Promise.all([
      fetch(`${API_BASE_URL}/reason-categories`, { headers }).then((r) =>
        r.ok ? r.json() : [],
      ),
      fetch(`${API_BASE_URL}/appointments`, { headers }).then((r) =>
        r.ok ? r.json() : [],
      ),
    ])
      .then(([catData, aptData]) => {
        // Build reason category map
        const catList = Array.isArray(catData)
          ? catData
          : catData?.data || catData?.reason_categories || [];
        const catMap = {};
        catList.forEach((c) => {
          if (c.reason_category_id) catMap[c.reason_category_id] = c.name;
        });
        setReasonCategoryMap(catMap);

        // Build appointment time map keyed by appointment_id
        const aptList = Array.isArray(aptData)
          ? aptData
          : aptData?.data || aptData?.appointments || [];
        const timeMap = {};
        aptList.forEach((apt) => {
          if (apt.appointment_id && apt.appointment_time)
            timeMap[apt.appointment_id] = apt.appointment_time;
        });
        setAppointmentTimeMap(timeMap);
      })
      .catch((err) =>
        console.error("[QueueManagementTable] lookup fetch:", err),
      );
  }, []);

  const getAppointmentTime = (queue) => {
    if (!queue.appointment_id) return "—";
    const time = appointmentTimeMap[queue.appointment_id];
    return time ? formatTime(time) : "—";
  };

  return (
    <>
      <motion.div
        className="relative overflow-hidden bg-white/95 rounded-2xl shadow-sm border border-[#00968a]/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#00968a] via-[#11b3a6] to-[#00968a]" />
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#00968a]/5 to-transparent">
          <h2 className="text-lg font-semibold text-[#25323A] mb-1">
            Queue Management
          </h2>
          <p className="text-sm text-gray-600">
            Manage patient flow and service status
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Scheduled Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isFetchingData ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-8 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-gray-200 rounded"></div>
                          <div className="h-3 w-20 bg-gray-200 rounded"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-28 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-20 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-40 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-16 bg-gray-200 rounded-md"></div>
                          <div className="h-7 w-16 bg-gray-200 rounded-md"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ) : todayQueues.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No queue entries for today (
                    {new Date(todayDate).toLocaleDateString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                    })}
                    )
                  </td>
                </tr>
              ) : (
                (() => {
                  const sorted = [...todayQueues].sort((a, b) => {
                    const timeA = a.appointment_id
                      ? appointmentTimeMap[a.appointment_id] || ""
                      : "";
                    const timeB = b.appointment_id
                      ? appointmentTimeMap[b.appointment_id] || ""
                      : "";
                    // Both have times: sort chronologically
                    if (timeA && timeB) return timeA.localeCompare(timeB);
                    // Entries with a time come before those without
                    if (timeA && !timeB) return -1;
                    if (!timeA && timeB) return 1;
                    // Neither has a time: fall back to queue_number
                    return a.queue_number - b.queue_number;
                  });
                  const firstWaitingId = sorted.find(
                    (q) => q.queue_status.toLowerCase() === "waiting",
                  )?.queue_entry_id;

                  return sorted.map((queue, index) => {
                    const patient = userMap[queue.user_id] || {};
                    const statusLower = queue.queue_status.toLowerCase();
                    const isFirstWaiting =
                      queue.queue_entry_id === firstWaitingId;

                    // Determine status badge color
                    let statusClass = "bg-gray-100 text-gray-700";
                    let statusLabel = queue.queue_status;

                    if (statusLower === "waiting") {
                      statusClass = "bg-yellow-100 text-yellow-700";
                      statusLabel = "Waiting";
                    } else if (
                      statusLower === "called" ||
                      statusLower === "serving"
                    ) {
                      statusClass = "bg-blue-100 text-blue-700";
                      statusLabel =
                        statusLower === "called" ? "Called" : "Serving";
                    } else if (statusLower === "now_serving") {
                      statusClass = "bg-green-100 text-green-700";
                      statusLabel = "now serving";
                    } else if (statusLower === "completed") {
                      statusClass =
                        "bg-white text-gray-700 border border-gray-300";
                      statusLabel = "Completed";
                    } else if (statusLower === "cancelled") {
                      statusClass = "bg-red-100 text-red-700";
                      statusLabel = "Cancelled";
                    }

                    return (
                      <tr
                        key={queue.queue_entry_id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#25323A]">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-[#25323A]">
                              {patient.name || "Unknown Patient"}
                            </p>
                            {patient.id_number && (
                              <p className="text-xs text-gray-500">
                                {patient.id_number}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-4 h-4 text-gray-400"
                            >
                              <path
                                fillRule="evenodd"
                                d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>{patient.phone_number || "N/A"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {getAppointmentTime(queue)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                          {reasonCategoryMap[queue.reason_category_id] ||
                            queue.reason ||
                            "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${statusClass}`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {statusLower === "waiting" && (
                              <button
                                onClick={() => handleCallPatient(queue)}
                                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                              >
                                Call
                              </button>
                            )}
                            {(statusLower === "called" ||
                              statusLower === "serving") && (
                              <button
                                onClick={() => handleCompletePatient(queue)}
                                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* SMS Test Table */}
      <motion.div
        className="relative overflow-hidden bg-white/95 rounded-2xl shadow-sm border border-orange-200 mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-400 via-orange-300 to-orange-400" />
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-transparent">
          <h2 className="text-lg font-semibold text-[#25323A] mb-1">
            SMS API Test
          </h2>
          <p className="text-sm text-gray-600">
            Send a test SMS to any registered user
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(users || []).length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                (users || []).map((user) => (
                  <tr
                    key={user.user_id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#25323A]">
                      {user.name || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.email_address || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.phone_number || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTestSms(user)}
                        disabled={!user.phone_number}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                      >
                        Send Test SMS
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </>
  );
}
