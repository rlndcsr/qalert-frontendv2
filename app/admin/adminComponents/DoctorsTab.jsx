import React, { useEffect, useState } from "react";
import AddDoctorModal from "./AddDoctorModal";
import { sileo } from "sileo";

const API_BASE_URL = "/api/proxy";

function buildScheduleRowsForDoctor(doctorSchedules, doctorId) {
  return doctorSchedules
    .filter((ds) => Number(ds.doctor_id) === Number(doctorId))
    .map((ds) => ({
      doctor_schedule_id: ds.doctor_schedule_id,
      schedule_id:
        ds.schedule_id != null ? Number(ds.schedule_id) : null,
    }));
}

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
  const [scheduleEditRows, setScheduleEditRows] = useState(
    /** @type {{ doctor_schedule_id: number | null, schedule_id: number | null }[]} */ ([]),
  );
  /** Snapshot when modal opened — used to detect deletes and updates */
  const [initialScheduleSnapshot, setInitialScheduleSnapshot] = useState([]);
  const [showDeleteDoctorConfirm, setShowDeleteDoctorConfirm] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get admin token from localStorage
      const adminToken =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken")
          : null;
      const doctorRes = await fetch(`${API_BASE_URL}/doctors`, {
        headers: { Accept: "application/json" },
      });
      if (!doctorRes.ok) throw new Error("Failed to fetch doctors");
      const doctorsData = await doctorRes.json();

      const doctorScheduleRes = await fetch(
        `${API_BASE_URL}/doctor-schedule`,
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
        `${API_BASE_URL}/schedules`,
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
    const rows = buildScheduleRowsForDoctor(doctorSchedules, doctor.doctor_id);
    setScheduleEditRows(rows.map((r) => ({ ...r })));
    setInitialScheduleSnapshot(rows.map((r) => ({ ...r })));
    setShowDeleteDoctorConfirm(false);
    setShowEditModal(true);
  };

  const closeEditDoctorModal = (forceClose = false) => {
    if (!forceClose && editLoading) return;
    setShowEditModal(false);
    setShowDeleteDoctorConfirm(false);
    setEditingDoctor(null);
    setEditName("");
    setScheduleEditRows([]);
    setInitialScheduleSnapshot([]);
  };

  const addScheduleRow = () => {
    setScheduleEditRows((prev) => [
      ...prev,
      {
        doctor_schedule_id: null,
        schedule_id: null,
        _clientId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      },
    ]);
  };

  const removeScheduleRow = (index) => {
    setScheduleEditRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateScheduleRow = (index, scheduleId) => {
    setScheduleEditRows((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        schedule_id: scheduleId === "" ? null : Number(scheduleId),
      };
      return next;
    });
  };

  const openDeleteDoctorConfirm = () => {
    if (!editingDoctor?.doctor_id) {
      sileo.error({
        title: "Delete failed",
        description: "Doctor ID is missing.",
      });
      return;
    }
    setShowDeleteDoctorConfirm(true);
  };

  const closeDeleteDoctorConfirm = () => {
    if (editLoading) return;
    setShowDeleteDoctorConfirm(false);
  };

  const confirmDeleteDoctor = async () => {
    if (!editingDoctor?.doctor_id) {
      sileo.error({
        title: "Delete failed",
        description: "Doctor ID is missing.",
      });
      return;
    }

    const name =
      editingDoctor.doctor_name?.trim() || "this doctor";

    setEditLoading(true);
    try {
      const adminToken =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken")
          : null;

      const response = await fetch(
        `${BACKEND_BASE}/doctors/${editingDoctor.doctor_id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: adminToken ? `Bearer ${adminToken}` : undefined,
          },
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.message || "Failed to delete doctor");
      }

      await fetchAll();
      setShowDeleteDoctorConfirm(false);
      closeEditDoctorModal(true);
      sileo.success({
        title: "Doctor removed",
        description: `${name} was deleted successfully.`,
      });
    } catch (err) {
      sileo.error({
        title: "Delete failed",
        description: err.message || "Could not delete this doctor.",
      });
    } finally {
      setEditLoading(false);
    }
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

    const selectedIds = scheduleEditRows
      .map((r) => r.schedule_id)
      .filter((id) => id != null);
    if (new Set(selectedIds).size !== selectedIds.length) {
      sileo.error({
        title: "Duplicate schedules",
        description: "Each schedule slot can only be selected once.",
      });
      return;
    }

    for (let i = 0; i < scheduleEditRows.length; i++) {
      const row = scheduleEditRows[i];
      if (row.schedule_id == null) {
        sileo.error({
          title: "Validation error",
          description: `Choose a schedule for row ${i + 1}, or remove that row.`,
        });
        return;
      }
    }

    setEditLoading(true);
    try {
      const adminToken =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken")
          : null;

      const authHeaders = {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: adminToken ? `Bearer ${adminToken}` : undefined,
      };

      const doctorId = editingDoctor.doctor_id;

      const response = await fetch(
        `${API_BASE_URL}/doctors/${doctorId}`,
        {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({ doctor_name: trimmedName }),
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.message || "Failed to update doctor");
      }

      const initialByDsId = new Map(
        initialScheduleSnapshot.map((r) => [
          r.doctor_schedule_id,
          r.schedule_id,
        ]),
      );
      const currentDsIds = new Set(
        scheduleEditRows
          .filter((r) => r.doctor_schedule_id != null)
          .map((r) => r.doctor_schedule_id),
      );

      for (const initial of initialScheduleSnapshot) {
        if (!currentDsIds.has(initial.doctor_schedule_id)) {
          const delRes = await fetch(
            `${API_BASE_URL}/doctor-schedule/${initial.doctor_schedule_id}`,
            {
              method: "DELETE",
              headers: authHeaders,
            },
          );
          if (!delRes.ok) {
            const errData = await delRes.json().catch(() => ({}));
            throw new Error(
              errData?.message || "Failed to remove a doctor schedule",
            );
          }
        }
      }

      for (const row of scheduleEditRows) {
        if (row.doctor_schedule_id == null) continue;
        const orig = initialByDsId.get(row.doctor_schedule_id);
        if (orig === row.schedule_id) continue;
        const putRes = await fetch(
          `${API_BASE_URL}/doctor-schedule/${row.doctor_schedule_id}`,
          {
            method: "PUT",
            headers: authHeaders,
            body: JSON.stringify({
              doctor_id: doctorId,
              schedule_id: row.schedule_id,
              sched: row.schedule_id,
            }),
          },
        );
        if (!putRes.ok) {
          const errData = await putRes.json().catch(() => ({}));
          throw new Error(
            errData?.message || "Failed to update a doctor schedule",
          );
        }
      }

      for (const row of scheduleEditRows) {
        if (row.doctor_schedule_id != null) continue;
        if (row.schedule_id == null) continue;
        const sched = row.schedule_id;
        const postRes = await fetch(`${API_BASE_URL}/doctor-schedule`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            doctor_id: doctorId,
            schedule_id: sched,
            sched,
          }),
        });
        if (!postRes.ok) {
          const errData = await postRes.json().catch(() => ({}));
          throw new Error(
            errData?.message || "Failed to add a doctor schedule",
          );
        }
      }

      await fetchAll();
      closeEditDoctorModal(true);
      sileo.success({
        title: "Doctor updated",
        description: "Doctor profile and schedules were saved.",
      });
    } catch (err) {
      sileo.error({
        title: "Update failed",
        description: err.message || "Failed to update doctor.",
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
          {/* Add Doctor Card - displayed first */}
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
          <AddDoctorModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            onDoctorAdded={fetchAll}
          />
          {showEditModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
              <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between px-6 pt-5">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Edit Doctor Profile
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Update the doctor name and assigned schedules.
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

                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Schedules
                      </label>
                      <button
                        type="button"
                        className="text-xs font-medium text-[#00968a] hover:text-[#00796b] disabled:opacity-50"
                        onClick={addScheduleRow}
                        disabled={editLoading}
                      >
                        + Add schedule
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Change a slot with the dropdown, remove a row, or add a
                      new assignment.
                    </p>
                    {scheduleEditRows.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-4 text-center text-xs text-slate-400">
                        No schedules assigned. Use &quot;Add schedule&quot; to
                        assign one.
                      </div>
                    ) : (
                      <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/60 p-2">
                        {scheduleEditRows.map((row, idx) => {
                          const scheduleOptions = schedules.filter((s) => {
                            const sid = Number(s.schedule_id ?? s.id);
                            const current = row.schedule_id;
                            const taken = new Set(
                              scheduleEditRows
                                .map((r, j) =>
                                  j !== idx && r.schedule_id != null
                                    ? Number(r.schedule_id)
                                    : null,
                                )
                                .filter((id) => id != null),
                            );
                            if (current != null && sid === Number(current))
                              return true;
                            return !taken.has(sid);
                          });
                          return (
                            <div
                              key={
                                row.doctor_schedule_id != null
                                  ? `ds-${row.doctor_schedule_id}`
                                  : row._clientId ?? `idx-${idx}`
                              }
                              className="flex items-center gap-2"
                            >
                              <select
                                className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-[#00968a] focus:ring-1 focus:ring-[#00968a]/30 disabled:bg-slate-50"
                                value={
                                  row.schedule_id == null
                                    ? ""
                                    : String(row.schedule_id)
                                }
                                onChange={(e) =>
                                  updateScheduleRow(idx, e.target.value)
                                }
                                disabled={editLoading}
                                required
                              >
                                <option value="">Select schedule…</option>
                                {scheduleOptions.map((s) => {
                                  const sid = s.schedule_id ?? s.id;
                                  return (
                                    <option key={sid} value={String(sid)}>
                                      {s.day} · {s.shift}
                                    </option>
                                  );
                                })}
                              </select>
                              <button
                                type="button"
                                className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-white disabled:opacity-50"
                                onClick={() => removeScheduleRow(idx)}
                                disabled={editLoading}
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                      onClick={openDeleteDoctorConfirm}
                      disabled={editLoading}
                    >
                      Delete doctor
                    </button>
                    <div className="ml-auto flex items-center gap-2">
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
                  </div>
                </form>
              </div>
            </div>
          )}
          {showDeleteDoctorConfirm && editingDoctor && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div
                className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-doctor-title"
              >
                <h4
                  id="delete-doctor-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Delete doctor?
                </h4>
                <p className="mt-2 text-sm text-slate-600">
                  This will permanently remove{" "}
                  <span className="font-medium text-slate-800">
                    {editingDoctor.doctor_name?.trim() || "this doctor"}
                  </span>
                  . This action cannot be undone.
                </p>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
                    onClick={closeDeleteDoctorConfirm}
                    disabled={editLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={confirmDeleteDoctor}
                    disabled={editLoading}
                  >
                    {editLoading ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
