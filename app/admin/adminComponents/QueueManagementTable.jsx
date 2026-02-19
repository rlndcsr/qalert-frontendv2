"use client";

import { motion } from "framer-motion";
import { toast } from "sonner";

const API_BASE_URL =
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

export default function QueueManagementTable({
  todayQueues,
  todayDate,
  userMap,
  isFetchingData,
  setQueues,
  setCalledPatients,
}) {
  const handleCallPatient = async (queue) => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      toast.error("Authentication required");
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

      // Update local state
      setQueues((prevQueues) =>
        prevQueues.map((q) =>
          q.queue_entry_id === queue.queue_entry_id
            ? { ...q, queue_status: "called" }
            : q,
        ),
      );

      // Add to called patients list
      setCalledPatients((prev) => [
        ...prev,
        { ...queue, queue_status: "called" },
      ]);

      // Send SMS notification
      try {
        const patient = userMap[queue.user_id] || {};
        const rawPhone = patient.phone_number || "";
        const moceanTo = rawPhone.replace(/^0/, "63");

        const text = `CSU-UCHW: You are now called for queue #${String(
          queue.queue_number,
        ).padStart(3, "0")}. Please proceed to the clinic. Thank you.`;

        await fetch("/api/sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from: "QAlert", to: moceanTo, text }),
        });

        toast.success("SMS sent to patient");
      } catch (smsError) {
        console.error("SMS send error:", smsError);
        toast.error("Failed to send SMS notification");
      }

      toast.success(`Called patient at queue #${queue.queue_number}`);
    } catch (error) {
      console.error("Error calling patient:", error);
      toast.error("Failed to call patient");
    }
  };

  const handleCompletePatient = (queue) => {
    console.log("Complete patient:", queue);
    toast.success(`Completed queue #${queue.queue_number}`);
  };

  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-[#25323A] mb-1">
          Queue Management
        </h2>
        <p className="text-sm text-gray-600">
          Manage patient flow and service status
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
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
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Wait Time
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
                    <td className="px-6 py-4">
                      <div className="h-4 w-40 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-12 bg-gray-200 rounded"></div>
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
                const sorted = todayQueues.sort(
                  (a, b) => a.queue_number - b.queue_number,
                );
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

                  // Calculate wait time using stored estimated_time_wait
                  const waitTime =
                    statusLower === "serving" || statusLower === "called"
                      ? "Now"
                      : queue.estimated_time_wait || `~${(index + 1) * 10}m`;

                  return (
                    <tr key={queue.queue_entry_id} className="hover:bg-gray-50">
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
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                        {queue.reason || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {waitTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {statusLower === "waiting" && isFirstWaiting && (
                            <button
                              onClick={() => handleCallPatient(queue)}
                              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors"
                            >
                              Call
                            </button>
                          )}
                          {(statusLower === "called" ||
                            statusLower === "serving") && (
                            <button
                              onClick={() => handleCompletePatient(queue)}
                              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-md transition-colors"
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
  );
}
