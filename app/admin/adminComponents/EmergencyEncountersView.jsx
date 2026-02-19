"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  Search,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Phone,
  FileText,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CreditCard,
  Filter,
  RotateCcw,
} from "lucide-react";
import {
  getEmergencyEncounters,
  getEmergencyEncounterById,
  createEmergencyEncounter,
  updateEmergencyEncounter,
  deleteEmergencyEncounter,
} from "../services/emergencyEncountersService";

// Utility functions for date/time formatting
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const formatTime = (timeString) => {
  if (!timeString) return "";
  // Handle both "HH:MM:SS" and ISO datetime formats
  let hours, minutes;
  if (timeString.includes("T")) {
    const date = new Date(timeString);
    hours = date.getHours();
    minutes = date.getMinutes();
  } else {
    const parts = timeString.split(":");
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
  }
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minutesStr = String(minutes).padStart(2, "0");
  return `${hours}:${minutesStr} ${ampm}`;
};

// Skeleton loader for table rows
function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-28" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-20" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-24" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-20" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-16" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-32" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded w-24" />
      </td>
    </tr>
  );
}

// Card Skeleton for mobile
function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-32 mb-3" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-4 bg-gray-200 rounded w-28" />
        <div className="h-4 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}

// View Modal Component
function ViewModal({ encounter, isOpen, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!encounter || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Emergency Encounter Details
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-130px)] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {encounter.patient_name}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Emergency
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 pt-2">
                  <div className="flex items-center gap-3 text-sm">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">ID Number:</span>
                    <span className="text-gray-900 font-medium">
                      {encounter.id_number || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Contact:</span>
                    <span className="text-gray-900 font-medium">
                      {encounter.contact_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Date:</span>
                    <span className="text-gray-900 font-medium">
                      {formatDate(encounter.date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Time:</span>
                    <span className="text-gray-900 font-medium">
                      {formatTime(encounter.time)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      Details
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    {encounter.details}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100">
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// Edit Modal Component
function EditModal({ encounter, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    patient_name: "",
    id_number: "",
    contact_number: "",
    date: "",
    time: "",
    details: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to format date to YYYY-MM-DD for input[type="date"]
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // Try to parse and format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper function to format time to HH:MM for input[type="time"]
  const formatTimeForInput = (timeString) => {
    if (!timeString) return "";
    // If already in HH:MM or HH:MM:SS format, extract HH:MM
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeString)) {
      return timeString.substring(0, 5);
    }
    // If it's an ISO datetime string
    if (timeString.includes("T")) {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return "";
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    }
    return timeString;
  };

  useEffect(() => {
    if (encounter) {
      setFormData({
        patient_name: encounter.patient_name || "",
        id_number: encounter.id_number || "",
        contact_number: encounter.contact_number || "",
        date: formatDateForInput(encounter.date),
        time: formatTimeForInput(encounter.time),
        details: encounter.details || "",
      });
    }
  }, [encounter]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.patient_name ||
      !formData.contact_number ||
      !formData.date ||
      !formData.time ||
      !formData.details
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave(encounter.id, formData);
      onClose();
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!encounter || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  Edit Emergency Encounter
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.patient_name}
                    onChange={(e) =>
                      setFormData({ ...formData, patient_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors text-sm"
                    placeholder="Enter patient name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Number
                  </label>
                  <input
                    type="text"
                    value={formData.id_number}
                    onChange={(e) =>
                      setFormData({ ...formData, id_number: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors text-sm"
                    placeholder="Enter ID number (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_number: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors text-sm"
                    placeholder="09XXXXXXXXX"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.details}
                    onChange={(e) =>
                      setFormData({ ...formData, details: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors text-sm resize-none"
                    placeholder="Describe the emergency situation..."
                  />
                </div>
              </form>

              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[#00968a] hover:bg-[#007a70] text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting && (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  )}
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// Delete Confirmation Modal
function DeleteModal({ encounter, isOpen, onClose, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(encounter.id);
      onClose();
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsDeleting(false);
    }
  };

  if (!encounter || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-5 text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Emergency Encounter
                </h2>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the encounter for{" "}
                  <span className="font-medium text-gray-700">
                    {encounter.patient_name}
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// Add New Encounter Modal
function AddEncounterModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    patient_name: "",
    id_number: "",
    contact_number: "",
    date: "",
    time: "",
    details: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default date and time when modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toTimeString().slice(0, 5);
      setFormData({
        patient_name: "",
        id_number: "",
        contact_number: "",
        date,
        time,
        details: "",
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.patient_name ||
      !formData.contact_number ||
      !formData.date ||
      !formData.time ||
      !formData.details
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#00968a]" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Add New Emergency Encounter
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.patient_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          patient_name: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors text-sm"
                      placeholder="Enter patient name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Number
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.id_number}
                      onChange={(e) =>
                        setFormData({ ...formData, id_number: e.target.value })
                      }
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors text-sm"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.contact_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact_number: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors text-sm"
                      placeholder="09XXXXXXXXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) =>
                          setFormData({ ...formData, time: e.target.value })
                        }
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Details <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      value={formData.details}
                      onChange={(e) =>
                        setFormData({ ...formData, details: e.target.value })
                      }
                      rows={3}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors text-sm resize-none"
                      placeholder="Describe the emergency situation..."
                    />
                  </div>
                </div>
              </form>

              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[#00968a] hover:bg-[#007a70] text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting && (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  )}
                  {isSubmitting ? "Recording..." : "Record Encounter"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// Pagination Component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-100 gap-3">
      <p className="text-sm text-gray-500">
        Showing {startItem} to {endItem} of {totalItems} encounters
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function EmergencyEncountersView() {
  // List state
  const [encounters, setEncounters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Date filter state
  const [dateFilterType, setDateFilterType] = useState("today"); // 'all', 'today', 'range'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Get today's date in YYYY-MM-DD format for comparisons (using local timezone)
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewEncounter, setViewEncounter] = useState(null);
  const [editEncounter, setEditEncounter] = useState(null);
  const [deleteEncounter, setDeleteEncounter] = useState(null);

  // Fetch encounters on mount
  useEffect(() => {
    fetchEncounters();
  }, []);

  const fetchEncounters = async () => {
    setIsLoading(true);
    try {
      const data = await getEmergencyEncounters();
      setEncounters(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error fetching encounters:", error);
      toast.error("Failed to load emergency encounters");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to normalize date to YYYY-MM-DD format for comparison
  // Handles UTC dates by converting to local timezone first
  const normalizeDateForComparison = (dateString) => {
    if (!dateString) return "";

    // If it contains 'T' or 'Z', it's an ISO/UTC date - parse and convert to local
    if (dateString.includes("T") || dateString.includes("Z")) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }

    // If it's already in YYYY-MM-DD format (without time)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // If it's in MM/DD/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}/.test(dateString)) {
      const [month, day, year] = dateString.split("/");
      return `${year}-${month}-${day}`;
    }

    // If it's in YYYY/MM/DD format
    if (/^\d{4}\/\d{2}\/\d{2}/.test(dateString)) {
      const [year, month, day] = dateString.split("/");
      return `${year}-${month}-${day}`;
    }

    // Try to parse as Date object
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    return dateString;
  };

  // Filter encounters based on search and date
  const filteredEncounters = useMemo(() => {
    let result = encounters;

    // Debug logging
    console.log("=== DEBUG Emergency Encounters Filter ===");
    console.log("dateFilterType:", dateFilterType);
    console.log("encounters count:", encounters.length);
    if (encounters.length > 0) {
      console.log("Sample encounter:", encounters[0]);
      console.log("Sample enc.date:", encounters[0]?.date);
      console.log(
        "Normalized date:",
        normalizeDateForComparison(encounters[0]?.date),
      );
    }
    console.log("Today string:", getTodayString());

    // Apply date filter
    if (dateFilterType === "today") {
      const today = getTodayString();
      result = result.filter((enc) => {
        const encDate = normalizeDateForComparison(enc.date);
        console.log(
          `Comparing: encDate="${encDate}" vs today="${today}" => ${encDate === today}`,
        );
        return encDate === today;
      });
    } else if (dateFilterType === "range" && startDate && endDate) {
      result = result.filter((enc) => {
        const encDate = normalizeDateForComparison(enc.date);
        return encDate >= startDate && encDate <= endDate;
      });
    }

    console.log("Filtered result count:", result.length);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (enc) =>
          enc.patient_name?.toLowerCase().includes(query) ||
          enc.date?.includes(query) ||
          enc.id_number?.toLowerCase().includes(query),
      );
    }

    return result;
  }, [encounters, searchQuery, dateFilterType, startDate, endDate]);

  // Pagination
  const totalPages = Math.ceil(filteredEncounters.length / itemsPerPage);
  const paginatedEncounters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEncounters.slice(start, start + itemsPerPage);
  }, [filteredEncounters, currentPage]);

  // Reset page when search or date filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilterType, startDate, endDate]);

  // Clear all filters
  const clearFilters = () => {
    setDateFilterType("all");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
  };

  // Check if any filter is active
  const hasActiveFilters = dateFilterType !== "all" || searchQuery.trim();

  const handleCreate = async (formData) => {
    try {
      await createEmergencyEncounter(formData);
      toast.success("Emergency encounter recorded successfully");
      fetchEncounters();
    } catch (error) {
      toast.error(error.message || "Failed to create emergency encounter");
      throw error;
    }
  };

  const handleEdit = async (id, data) => {
    try {
      await updateEmergencyEncounter(id, data);
      toast.success("Emergency encounter updated successfully");
      fetchEncounters();
    } catch (error) {
      toast.error(error.message || "Failed to update emergency encounter");
      throw error;
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEmergencyEncounter(id);
      toast.success("Emergency encounter deleted successfully");
      fetchEncounters();
    } catch (error) {
      toast.error(error.message || "Failed to delete emergency encounter");
      throw error;
    }
  };

  return (
    <motion.div
      className="max-w-7xl mx-auto space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Emergency Encounters
            </h1>
            <p className="text-sm text-gray-500">
              Record and manage emergency patient visits
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-[#00968a] hover:bg-[#007a70] text-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Encounter
        </button>
      </div>

      {/* Encounters List */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        {/* Header with Search */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Emergency Encounters List
            </h2>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors text-sm"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Type Buttons */}
              <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                <button
                  onClick={() => {
                    setDateFilterType("all");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
                    dateFilterType === "all"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDateFilterType("today")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
                    dateFilterType === "today"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateFilterType("range")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
                    dateFilterType === "range"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Date Range
                </button>
              </div>

              {/* Date Range Inputs */}
              {dateFilterType === "range" && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors"
                    />
                  </div>
                  <span className="text-gray-400 text-sm">to</span>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ID Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))
              ) : paginatedEncounters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <AlertTriangle className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">
                        No emergency encounters found
                      </p>
                      <p className="text-gray-400 text-sm">
                        {hasActiveFilters
                          ? "Try adjusting your filters"
                          : "Add a new encounter above"}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="mt-3 text-sm text-[#00968a] hover:text-[#007a70] font-medium cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEncounters.map((encounter) => (
                  <tr
                    key={encounter.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">
                        {encounter.patient_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {encounter.id_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {encounter.contact_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(encounter.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatTime(encounter.time)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                      {encounter.details}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewEncounter(encounter)}
                          className="p-2 text-gray-500 hover:text-[#00968a] hover:bg-[#00968a]/10 rounded-lg transition-colors cursor-pointer"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditEncounter(encounter)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteEncounter(encounter)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden p-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
          ) : paginatedEncounters.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                No emergency encounters found
              </p>
              <p className="text-gray-400 text-sm">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Add a new encounter above"}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-sm text-[#00968a] hover:text-[#007a70] font-medium cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            paginatedEncounters.map((encounter) => (
              <div
                key={encounter.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {encounter.patient_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {encounter.id_number || "No ID"}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Emergency
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {encounter.contact_number}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {formatDate(encounter.date)} at {formatTime(encounter.time)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {encounter.details}
                </p>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setViewEncounter(encounter)}
                    className="flex-1 py-2 text-sm font-medium text-[#00968a] hover:bg-[#00968a]/10 rounded-lg transition-colors cursor-pointer"
                  >
                    View
                  </button>
                  <button
                    onClick={() => setEditEncounter(encounter)}
                    className="flex-1 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteEncounter(encounter)}
                    className="flex-1 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!isLoading && filteredEncounters.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredEncounters.length}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>

      {/* Modals */}
      <AddEncounterModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleCreate}
      />
      <ViewModal
        encounter={viewEncounter}
        isOpen={!!viewEncounter}
        onClose={() => setViewEncounter(null)}
      />
      <EditModal
        encounter={editEncounter}
        isOpen={!!editEncounter}
        onClose={() => setEditEncounter(null)}
        onSave={handleEdit}
      />
      <DeleteModal
        encounter={deleteEncounter}
        isOpen={!!deleteEncounter}
        onClose={() => setDeleteEncounter(null)}
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
