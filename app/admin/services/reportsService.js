"use client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_BASE_URL ||
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

/**
 * Get auth headers with Bearer token
 */
const getAuthHeaders = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": true,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Fetch appointments for a specific month
 * @param {string} yearMonth - Format: YYYY-MM
 * @param {object} filters - Optional filters (doctorId, status)
 */
export const getAppointmentsByMonth = async (yearMonth, filters = {}) => {
  const params = new URLSearchParams();
  params.append("month", yearMonth);
  if (filters.doctorId) params.append("doctor_id", filters.doctorId);
  if (filters.status) params.append("status", filters.status);

  const response = await fetch(
    `${API_BASE_URL}/appointments?${params.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch appointments");
  }

  return response.json();
};

/**
 * Fetch all queues (will be filtered client-side by month)
 */
export const getQueues = async () => {
  const response = await fetch(`${API_BASE_URL}/queues`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch queues");
  }

  return response.json();
};

/**
 * Fetch emergency encounters for a specific month
 * @param {string} yearMonth - Format: YYYY-MM
 */
export const getEmergencyEncountersByMonth = async (yearMonth) => {
  const response = await fetch(`${API_BASE_URL}/emergency-encounters`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch emergency encounters");
  }

  const data = await response.json();

  // Handle different API response formats (array or { data: [...] })
  const encounters = Array.isArray(data)
    ? data
    : data?.data || data?.encounters || [];

  // Filter by month client-side if the API doesn't support month filtering
  const [year, month] = yearMonth.split("-");
  return encounters.filter((encounter) => {
    if (!encounter.encounter_date) return false;
    const encounterDate = new Date(encounter.encounter_date);
    return (
      encounterDate.getFullYear() === parseInt(year) &&
      encounterDate.getMonth() + 1 === parseInt(month)
    );
  });
};

/**
 * Fetch users for name/email mapping
 */
export const getUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch users");
  }

  return response.json();
};

/**
 * Fetch doctors list
 */
export const getDoctors = async () => {
  const response = await fetch(`${API_BASE_URL}/doctors`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch doctors");
  }

  return response.json();
};

/**
 * Fetch reason categories
 */
export const getReasonCategories = async () => {
  const response = await fetch(`${API_BASE_URL}/reason-categories`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch reason categories");
  }

  return response.json();
};

/**
 * Generate report data for a specific month
 * Aggregates appointments, queues, and emergency encounters
 * @param {string} yearMonth - Format: YYYY-MM
 * @param {object} filters - Optional filters
 */
export const generateReportData = async (yearMonth, filters = {}) => {
  const [year, month] = yearMonth.split("-");

  // Fetch all required data in parallel
  const [
    queuesResponse,
    emergencyData,
    usersResponse,
    reasonCategoriesResponse,
  ] = await Promise.all([
    getQueues(),
    getEmergencyEncountersByMonth(yearMonth),
    getUsers(),
    getReasonCategories(),
  ]);

  // Normalize responses to arrays (handle { data: [...] } or direct array formats)
  const queuesData = Array.isArray(queuesResponse)
    ? queuesResponse
    : queuesResponse?.data || [];
  const usersData = Array.isArray(usersResponse)
    ? usersResponse
    : usersResponse?.data || [];
  const reasonCategoriesData = Array.isArray(reasonCategoriesResponse)
    ? reasonCategoriesResponse
    : reasonCategoriesResponse?.data || [];

  // Also try to fetch doctors if available
  let doctorsData = [];
  try {
    const doctorsResponse = await getDoctors();
    doctorsData = Array.isArray(doctorsResponse)
      ? doctorsResponse
      : doctorsResponse?.data || [];
  } catch (error) {
    console.warn("Could not fetch doctors:", error);
  }

  // Create user lookup map
  const userMap = {};
  usersData.forEach((user) => {
    userMap[user.user_id] = user;
  });

  // Create reason category lookup map
  const reasonCategoryMap = {};
  reasonCategoriesData.forEach((cat) => {
    reasonCategoryMap[cat.id || cat.reason_category_id] = cat.name;
  });

  // Create doctor lookup map
  const doctorMap = {};
  doctorsData.forEach((doctor) => {
    doctorMap[doctor.doctor_id || doctor.id] = doctor;
  });

  // Filter queues by month
  const monthQueues = queuesData.filter((queue) => {
    if (!queue.date) return false;
    const queueDate = new Date(queue.date);
    return (
      queueDate.getFullYear() === parseInt(year) &&
      queueDate.getMonth() + 1 === parseInt(month)
    );
  });

  // Apply queue status filter
  let filteredQueues = monthQueues;
  if (filters.queueStatus && filters.queueStatus !== "all") {
    filteredQueues = monthQueues.filter(
      (q) => q.queue_status.toLowerCase() === filters.queueStatus.toLowerCase(),
    );
  }

  // Apply doctor filter if applicable
  if (filters.doctorId && filters.doctorId !== "all") {
    filteredQueues = filteredQueues.filter(
      (q) => q.doctor_id === parseInt(filters.doctorId),
    );
  }

  // Calculate summary metrics
  const summary = {
    totalQueues: filteredQueues.length,
    completedQueues: filteredQueues.filter(
      (q) => q.queue_status.toLowerCase() === "completed",
    ).length,
    cancelledQueues: filteredQueues.filter(
      (q) => q.queue_status.toLowerCase() === "cancelled",
    ).length,
    waitingQueues: filteredQueues.filter(
      (q) => q.queue_status.toLowerCase() === "waiting",
    ).length,
    emergencyEncounters: emergencyData.length,
    uniquePatients: new Set(filteredQueues.map((q) => q.user_id)).size,
  };

  return {
    queues: filteredQueues,
    emergencyEncounters: emergencyData,
    users: userMap,
    reasonCategories: reasonCategoryMap,
    doctors: doctorMap,
    summary,
    month: yearMonth,
  };
};

/**
 * Convert report data to CSV string
 * @param {object} reportData - Report data from generateReportData
 * @param {string} monthLabel - Human readable month label (e.g., "February 2026")
 */
export const convertToCSV = (reportData, monthLabel) => {
  const {
    queues,
    emergencyEncounters,
    users,
    reasonCategories,
    doctors,
    summary,
  } = reportData;

  let csv = "";

  // Add report header
  csv += `QAlert Monthly Report - ${monthLabel}\n`;
  csv += `Generated: ${new Date().toLocaleString()}\n\n`;

  // Add summary section
  csv += "=== SUMMARY ===\n";
  csv += `Total Queue Entries,${summary.totalQueues}\n`;
  csv += `Completed,${summary.completedQueues}\n`;
  csv += `Cancelled,${summary.cancelledQueues}\n`;
  csv += `Waiting,${summary.waitingQueues}\n`;
  csv += `Emergency Encounters,${summary.emergencyEncounters}\n`;
  csv += `Unique Patients,${summary.uniquePatients}\n\n`;

  // Add queue entries section
  csv += "=== QUEUE ENTRIES ===\n";
  csv +=
    "Queue Number,Date,Time Created,Patient Name,Patient Email,Reason/Purpose,Doctor Name,Status\n";

  queues.forEach((queue) => {
    const user = users[queue.user_id] || {};
    const reasonName =
      reasonCategories[queue.reason_category_id] || queue.reason || "N/A";
    const doctor = doctors[queue.doctor_id] || {};
    const doctorName = doctor.name || doctor.doctor_name || "N/A";

    // Extract time from created_at
    let timeCreated = "N/A";
    if (queue.created_at) {
      const timeParts = queue.created_at.split(" ");
      timeCreated = timeParts.length >= 2 ? timeParts[1] : queue.created_at;
    }

    csv += `"${queue.queue_number || "N/A"}",`;
    csv += `"${queue.date || "N/A"}",`;
    csv += `"${timeCreated}",`;
    csv += `"${user.name || "N/A"}",`;
    csv += `"${user.email_address || "N/A"}",`;
    csv += `"${reasonName.replace(/"/g, '""')}",`;
    csv += `"${doctorName}",`;
    csv += `"${queue.queue_status || "N/A"}"\n`;
  });

  csv += "\n";

  // Add emergency encounters section
  csv += "=== EMERGENCY ENCOUNTERS ===\n";
  csv +=
    "Encounter Date,Encounter Time,Patient Name,Contact Number,ID Number,Details/Notes\n";

  emergencyEncounters.forEach((encounter) => {
    csv += `"${encounter.encounter_date || "N/A"}",`;
    csv += `"${encounter.encounter_time || "N/A"}",`;
    csv += `"${(encounter.patient_name || "N/A").replace(/"/g, '""')}",`;
    csv += `"${encounter.contact_number || "N/A"}",`;
    csv += `"${encounter.id_number || "N/A"}",`;
    csv += `"${(encounter.details || encounter.notes || "N/A").replace(/"/g, '""')}"\n`;
  });

  return csv;
};

/**
 * Download CSV file
 * @param {string} csvContent - CSV string content
 * @param {string} filename - Filename for download
 */
export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Download PDF report from the backend API
 * @param {string} yearMonth - Format: YYYY-MM
 * @returns {Promise<void>}
 */
export const downloadPDFReport = async (yearMonth) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  const response = await fetch(
    `${API_BASE_URL}/admin/reports/pdf?month=${yearMonth}`,
    {
      method: "GET",
      headers: {
        Accept: "application/pdf",
        "ngrok-skip-browser-warning": true,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    },
  );

  if (!response.ok) {
    // Try to get error message from response
    let errorMessage = "Failed to generate PDF report";
    const contentType = response.headers.get("Content-Type") || "";

    if (contentType.includes("application/json")) {
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }
    } else {
      // For non-JSON responses, try to read as text
      try {
        const text = await response.text();
        if (text && text.length < 200) {
          errorMessage = text;
        }
      } catch {
        // Ignore read errors
      }
    }

    console.error("PDF Report Error:", {
      status: response.status,
      statusText: response.statusText,
      message: errorMessage,
    });

    throw new Error(errorMessage);
  }

  // Get the blob from the response
  const blob = await response.blob();

  // Extract filename from Content-Disposition header or use default
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = `QAlert_Report_${yearMonth}.pdf`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  // Create download link and trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
