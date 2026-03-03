"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Mail,
  Phone,
  History,
  Users,
  CreditCard,
} from "lucide-react";

// Utility: initials from name
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_BASE_URL ||
  "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api";

// Skeleton loader for table rows
function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 bg-gray-200 rounded w-28" />
            <div className="h-3 bg-gray-200 rounded w-40" />
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="h-3.5 bg-gray-200 rounded w-24" />
      </td>
      <td className="px-5 py-4">
        <div className="h-3.5 bg-gray-200 rounded w-20" />
      </td>
      <td className="px-5 py-4">
        <div className="h-5 bg-gray-200 rounded-full w-12" />
      </td>
      <td className="px-5 py-4">
        <div className="h-5 bg-gray-200 rounded-full w-12 ml-auto" />
      </td>
    </tr>
  );
}

// Patient History Modal Component
function PatientHistoryModal({ patient, isOpen, onClose }) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
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

  if (!patient) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#00968a]" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Patient Details
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-130px)]">
                {/* Patient Info Section */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#00968a]/10 flex items-center justify-center shrink-0">
                      <span className="text-xl font-bold text-[#00968a]">
                        {getInitials(patient.name)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {patient.name}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Active
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-gray-600 truncate">
                        {patient.email_address || "\u2014"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-gray-600">
                        {patient.phone_number || "\u2014"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-gray-600 font-mono">
                        {patient.id_number || "\u2014"}
                      </span>
                    </div>
                    {patient.gender && (
                      <div className="flex items-center gap-3 text-sm">
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-gray-600 capitalize">
                          {patient.gender}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Queue History Section */}
                <div className="border-t border-gray-100 pt-5">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="w-5 h-5 text-[#00968a]" />
                    <h4 className="text-base font-semibold text-gray-900">
                      Queue History
                    </h4>
                  </div>

                  {/* Placeholder Content */}
                  <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-3">
                      <History className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">
                      Queue history will be displayed here.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
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
    </AnimatePresence>
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
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
      <p className="text-xs text-gray-400">
        <span className="font-semibold text-gray-600">
          {startItem}–{endItem}
        </span>{" "}
        of {totalItems} users
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 text-xs font-semibold text-gray-600">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function PatientRecordView() {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal state
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch patients data
  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
          throw new Error("Not authenticated");
        }

        const response = await fetch(`${API_BASE_URL}/users`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch patients");
        }

        const data = await response.json();
        // Filter only patients (role === "patient")
        const patientList = Array.isArray(data)
          ? data.filter((user) => user.role === "patient")
          : [];
        setPatients(patientList);
      } catch (err) {
        console.error("Error fetching patients:", err);
        setError(err.message || "Failed to load patients");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Filter and search patients
  const filteredPatients = useMemo(() => {
    let result = patients;

    // Apply gender filter
    if (genderFilter !== "all") {
      result = result.filter(
        (patient) =>
          patient.gender?.toLowerCase() === genderFilter.toLowerCase(),
      );
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (patient) =>
          patient.name?.toLowerCase().includes(query) ||
          patient.email_address?.toLowerCase().includes(query),
      );
    }

    return result;
  }, [patients, genderFilter, searchQuery]);

  // Paginated patients
  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPatients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPatients, currentPage, itemsPerPage]);

  // Total pages
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPatients.length / itemsPerPage),
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, genderFilter]);

  // Handle row click
  const handleRowClick = (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedPatient(null), 200);
  };

  return (
    <motion.div
      key="patient-record"
      className="max-w-7xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#00968a] flex items-center justify-center shadow-md shadow-[#00968a]/20 shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                Users
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                View user information
              </p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-xs font-medium text-gray-600">
                    {filteredPatients.length} users
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: title + count */}
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
                All Users
              </h2>
              {!isLoading && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  {filteredPatients.length}
                </span>
              )}
            </div>

            {/* Right: gender tabs + search */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Gender filter */}
              <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
                {["all", "male", "female"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenderFilter(g)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer capitalize ${
                      genderFilter === g
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {g === "all"
                      ? "All"
                      : g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00968a]/20 focus:border-[#00968a] transition-colors text-xs bg-gray-50 w-52"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3.5 text-left">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Patient
                  </span>
                </th>
                <th className="px-5 py-3.5 text-left">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Contact
                  </span>
                </th>
                <th className="px-5 py-3.5 text-left">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    ID Number
                  </span>
                </th>
                <th className="px-5 py-3.5 text-left">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Gender
                  </span>
                </th>
                <th className="px-5 py-3.5 text-right">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Status
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRowSkeleton key={index} />
                ))
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <p className="text-sm font-medium text-red-500">{error}</p>
                  </td>
                </tr>
              ) : paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Users className="w-7 h-7 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">
                          No users found
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {searchQuery || genderFilter !== "all"
                            ? "Try adjusting your filters"
                            : "Registered users will appear here"}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient) => (
                  <tr
                    key={patient.user_id}
                    onClick={() => handleRowClick(patient)}
                    className="group hover:bg-gray-50/70 cursor-pointer transition-colors"
                  >
                    {/* Patient */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#00968a]/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-[#00968a]">
                            {getInitials(patient.name)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {patient.name || ""}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {patient.email_address || ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Contact */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-medium">
                          {patient.phone_number || "\u2014"}
                        </span>
                      </div>
                    </td>
                    {/* ID Number */}
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono text-gray-500">
                        {patient.id_number || "\u2014"}
                      </span>
                    </td>
                    {/* Gender */}
                    <td className="px-5 py-4">
                      {patient.gender ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            patient.gender?.toLowerCase() === "female"
                              ? "bg-pink-50 text-pink-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {patient.gender}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">\u2014</span>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-50 text-green-700">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && !error && filteredPatients.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredPatients.length}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>

      {/* Patient History Modal */}
      <PatientHistoryModal
        patient={selectedPatient}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </motion.div>
  );
}
