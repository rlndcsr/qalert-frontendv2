import React, { useEffect, useState } from "react";
import AddDoctorModal from "./AddDoctorModal";
import { sileo } from "sileo";

export default function DoctorsTab() {
  const [doctors, setDoctors] = useState([]);
  const [doctorSchedules, setDoctorSchedules] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get admin token from localStorage
      const adminToken =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken")
          : null;
      const doctorRes = await fetch("http://qalert-backend.test/api/doctors", {
        headers: { Accept: "application/json" },
      });
      if (!doctorRes.ok) throw new Error("Failed to fetch doctors");
      const doctorsData = await doctorRes.json();

      const doctorScheduleRes = await fetch(
        "http://qalert-backend.test/api/doctor-schedule",
        {
          headers: {
            Accept: "application/json",
            Authorization: adminToken ? `Bearer ${adminToken}` : undefined,
          },
        },
      );
      if (!doctorScheduleRes.ok)
        throw new Error("Failed to fetch doctor schedules");
      const doctorSchedulesData = await doctorScheduleRes.json();

      const schedulesRes = await fetch(
        "http://qalert-backend.test/api/schedules",
        {
          headers: {
            Accept: "application/json",
            Authorization: adminToken ? `Bearer ${adminToken}` : undefined,
          },
        },
      );
      if (!schedulesRes.ok) throw new Error("Failed to fetch schedules");
      const schedulesData = await schedulesRes.json();

      setDoctors(doctorsData);
      setDoctorSchedules(doctorSchedulesData);
      setSchedules(schedulesData);
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openEditDoctorModal = (doctor) => {
    setEditingDoctor(doctor);
    setEditName(doctor?.doctor_name || "");
    setShowEditModal(true);
  };

  const closeEditDoctorModal = () => {
    if (editLoading) return;
    setShowEditModal(false);
    setEditingDoctor(null);
    setEditName("");
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    if (!editingDoctor?.doctor_id) {
      sileo.error({
        title: "Update failed",
        description: "Doctor ID is missing.",
      });
      return;
    }

    const trimmedName = editName.trim();
    if (!trimmedName) {
      sileo.error({
        title: "Validation error",
        description: "Doctor name is required.",
      });
      return;
    }

    setEditLoading(true);
    try {
      const adminToken =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken")
          : null;

      const response = await fetch(
        `http://qalert-backend.test/api/doctors/${editingDoctor.doctor_id}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: adminToken ? `Bearer ${adminToken}` : undefined,
          },
          body: JSON.stringify({ doctor_name: trimmedName }),
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.message || "Failed to update doctor");
      }

      await fetchAll();
      closeEditDoctorModal();
      sileo.success({
        title: "Doctor updated",
        description: "Doctor profile was updated successfully.",
      });
    } catch (err) {
      sileo.error({
        title: "Update failed",
        description: err.message || "Failed to update doctor profile.",
      });
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-4">
      <h2 className="text-xl font-semibold mb-4">Doctors</h2>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col items-center animate-pulse min-h-[220px]"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 mb-4" />
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-16 bg-gray-100 rounded mb-1" />
              <div className="h-3 w-32 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : doctors.length === 0 ? (
        <div className="text-gray-500">No doctors found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Doctor Cards */}
          {doctors.map((doctor) => {
            // Find all doctorSchedules for this doctor
            const schedulesForDoctor = doctorSchedules.filter(
              (ds) => ds.doctor_id === doctor.doctor_id,
            );
            return (
              <div
                key={doctor.doctor_id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col items-center hover:shadow-md transition-shadow duration-200"
              >
                <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-teal-700">
                    {(() => {
                      if (!doctor.doctor_name) return "?";
                      const parts = doctor.doctor_name.trim().split(" ");
                      // Find the first part that is not 'Doc' (case-insensitive)
                      const realName = parts.find(
                        (part) => part.toLowerCase() !== "doc",
                      );
                      return realName
                        ? realName.charAt(0)
                        : doctor.doctor_name.charAt(0);
                    })()}
                  </span>
                </div>
                <div className="text-lg font-semibold text-gray-900 text-center mb-2">
                  {doctor.doctor_name}
                </div>
                <div className="w-full mt-2">
                  <div className="text-xs font-semibold text-gray-500 mb-1 text-center">
                    Schedules
                  </div>
                  {schedulesForDoctor.length === 0 ? (
                    <div className="text-gray-400 text-xs text-center">
                      No schedules
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-1 w-full">
                      {schedulesForDoctor.map((ds) => {
                        const sched = schedules.find(
                          (s) => s.schedule_id === ds.schedule_id,
                        );
                        return sched ? (
                          <li
                            key={ds.doctor_schedule_id}
                            className="bg-gray-50 border border-gray-100 rounded px-3 py-1 text-xs flex justify-between items-center"
                          >
                            <span className="font-medium text-gray-700">
                              {sched.day}
                            </span>
                            <span className="text-gray-500">{sched.shift}</span>
                          </li>
                        ) : null;
                      })}
                    </ul>
                  )}
                  <button
                    className="mt-4 w-full px-3 py-1 rounded border border-teal-200 text-teal-700 bg-teal-50 text-xs font-medium hover:bg-teal-100 transition-colors hover:cursor-pointer"
                    onClick={() => openEditDoctorModal(doctor)}
                    type="button"
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
          {/* Add Doctor Card at the end */}
          <div
            className="bg-white border-2 border-dashed border-gray-300 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center hover:border-teal-400 transition-colors duration-200 cursor-pointer min-h-[220px]"
            style={{ minHeight: 220 }}
            tabIndex={0}
            aria-label="Add Doctor"
            onClick={() => setShowAddModal(true)}
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-teal-500">+</span>
            </div>
            <div className="text-lg font-semibold text-gray-700 text-center mb-1">
              Add Doctor
            </div>
            <div className="text-sm text-gray-400 text-center">
              Onboard a new medical specialist to the team
            </div>
          </div>
          <AddDoctorModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            onDoctorAdded={fetchAll}
          />
          {showEditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
              <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between px-6 pt-5">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Edit Doctor Profile
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Update the doctor name shown in the admin and patient
                      views.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
                    onClick={closeEditDoctorModal}
                    disabled={editLoading}
                    aria-label="Close edit modal"
                  >
                    <span className="text-lg leading-none">×</span>
                  </button>
                </div>

                <form onSubmit={handleUpdateDoctor} className="px-6 pb-5 pt-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">
                      Doctor name
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#00968a] focus:ring-2 focus:ring-[#00968a]/20 disabled:bg-slate-50"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter doctor name"
                      autoFocus
                      disabled={editLoading}
                      required
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
                      onClick={closeEditDoctorModal}
                      disabled={editLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-[#00968a] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#00796b] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={editLoading || !editName.trim()}
                    >
                      {editLoading ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
