"use client";

import { motion } from "framer-motion";
import { toast } from "sonner";

const API_BASE_URL =
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

export default function CalledPatientDisplay({
  calledPatients,
  userMap,
  setQueues,
  setCalledPatients,
}) {
  const handleStatusChange = async (patient, newStatus) => {
    if (!newStatus) return;

    const token = localStorage.getItem("adminToken");
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/queues/status/${patient.queue_entry_id}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": true,
          },
          body: JSON.stringify({
            queue_status: newStatus,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update queue status");
      }

      // Update local state
      setQueues((prevQueues) =>
        prevQueues.map((q) =>
          q.queue_entry_id === patient.queue_entry_id
            ? { ...q, queue_status: newStatus }
            : q,
        ),
      );

      if (newStatus === "now_serving") {
        toast.success("Patient is now being served");
        setCalledPatients((prev) =>
          prev.map((p) =>
            p.queue_entry_id === patient.queue_entry_id
              ? { ...p, queue_status: "now_serving" }
              : p,
          ),
        );
      } else if (newStatus === "completed") {
        toast.success("Patient service completed");
        setCalledPatients((prev) =>
          prev.filter((p) => p.queue_entry_id !== patient.queue_entry_id),
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update patient status");
    }
  };

  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5 text-blue-600"
        >
          <path d="M16.881 4.345A23.112 23.112 0 018.25 6H7.5a5.25 5.25 0 00-.88 10.427 21.593 21.593 0 001.378 3.94c.464 1.004 1.674 1.32 2.582.796l.657-.379c.88-.508 1.165-1.593.772-2.468a17.116 17.116 0 01-.628-1.607c1.918.258 3.76.75 5.5 1.446A21.727 21.727 0 0018 11.25c0-2.414-.393-4.735-1.119-6.905zM18.26 3.74a23.22 23.22 0 011.24 7.51 23.22 23.22 0 01-1.24 7.51c-.055.161-.111.322-.17.482a.75.75 0 101.409.516 24.555 24.555 0 001.415-6.43 2.992 2.992 0 00.836-2.078c0-.806-.319-1.54-.836-2.078a24.65 24.65 0 00-1.415-6.43.75.75 0 10-1.409.516c.059.16.116.321.17.482z" />
        </svg>
        <h2 className="text-lg font-semibold text-[#25323A]">
          Called Patient{calledPatients.length > 1 ? "s" : ""}
        </h2>
      </div>
      {calledPatients.length > 0 ? (
        <div className="flex flex-col gap-4">
          {calledPatients.map((calledPatient) => (
            <div key={calledPatient.queue_entry_id} className="flex gap-4">
              {/* Patient Info */}
              <div
                className={`flex-1 p-4 rounded-lg ${
                  calledPatient.queue_status === "now_serving"
                    ? "bg-green-50 border border-green-200"
                    : "bg-blue-50 border border-blue-200"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-[#25323A]">
                      {userMap[calledPatient.user_id]?.name ||
                        "Unknown Patient"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Queue #
                      {String(calledPatient.queue_number).padStart(3, "0")}
                    </p>
                  </div>
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      calledPatient.queue_status === "now_serving"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {calledPatient.queue_status === "now_serving"
                      ? "Now Serving"
                      : "Called"}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  {calledPatient.reason}
                </p>
                <div className="flex items-center gap-2">
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
                  <span className="text-xs text-gray-600">
                    {userMap[calledPatient.user_id]?.phone_number || "N/A"}
                  </span>
                </div>
              </div>

              {/* Update Status */}
              <div className="w-56 flex flex-col shrink-0">
                <label className="block text-sm font-medium text-[#25323A] mb-2">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00968a] text-sm h-fit bg-white"
                  value=""
                  onChange={(e) =>
                    handleStatusChange(calledPatient, e.target.value)
                  }
                >
                  <option value="" disabled>
                    {calledPatient.queue_status === "now_serving"
                      ? "Now Serving"
                      : "Called"}
                  </option>
                  {calledPatient.queue_status !== "now_serving" && (
                    <option value="now_serving">Now Serving</option>
                  )}
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
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
            No patient has been called yet
          </p>
        </div>
      )}
    </motion.div>
  );
}
