import { useEffect, useRef, useState } from "react";
import { sileo } from "sileo";

/** Normalize Laravel / nested API shapes for POST /doctors responses. */
function extractDoctorId(payload) {
  if (payload == null) return null;
  if (typeof payload === "number") return payload;
  if (Array.isArray(payload) && payload[0]) {
    return extractDoctorId(payload[0]);
  }
  const p = payload;
  const nested =
    p.doctor_id ??
    p.id ??
    p.data?.doctor_id ??
    p.data?.id ??
    p.data?.doctor?.doctor_id ??
    p.data?.doctor?.id ??
    p.doctor?.doctor_id ??
    p.doctor?.id;
  if (nested != null && nested !== "") return nested;
  if (Array.isArray(p.data) && p.data[0]) {
    return extractDoctorId(p.data[0]);
  }
  return null;
}

export default function AddDoctorModal({ open, onClose, onDoctorAdded }) {
  const [doctorName, setDoctorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [step, setStep] = useState(1); // 1: create doctor, 2: assign schedule
  const [createdDoctor, setCreatedDoctor] = useState(null);
  const createdDoctorIdRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setDoctorName("");
    setError(null);
    setCreatedDoctor(null);
    createdDoctorIdRef.current = null;
    setSelectedSchedules([]);
    setSchedules([]);
  }, [open]);

  // Fetch schedules only after doctor is created
  useEffect(() => {
    if (step !== 2 || !open) return;
    const fetchSchedules = async () => {
      try {
        const adminToken =
          typeof window !== "undefined"
            ? localStorage.getItem("adminToken")
            : null;
        const res = await fetch("http://qalert-backend.test/api/schedules", {
          headers: {
            Accept: "application/json",
            Authorization: adminToken ? `Bearer ${adminToken}` : undefined,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch schedules");
        const data = await res.json();
        setSchedules(data);
      } catch (err) {
        setSchedules([]);
      }
    };
    fetchSchedules();
  }, [step, open]);

  const handleScheduleChange = (sched) => {
    setSelectedSchedules((prev) =>
      prev.includes(sched)
        ? prev.filter((id) => id !== sched)
        : [...prev, sched],
    );
  };

  // Step 1: Create doctor
  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const adminToken =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken")
          : null;
      const res = await fetch("http://qalert-backend.test/api/doctors", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: adminToken ? `Bearer ${adminToken}` : undefined,
        },
        body: JSON.stringify({ doctor_name: doctorName, is_active: 1 }),
      });
      if (!res.ok) throw new Error("Failed to add doctor");
      const doctor = await res.json();
      const id = extractDoctorId(doctor);
      if (id != null) createdDoctorIdRef.current = id;
      setCreatedDoctor(doctor);
      setStep(2);
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Assign schedule(s)
  const handleAssignSchedules = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const adminToken =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken")
          : null;
      const doctorId =
        extractDoctorId(createdDoctor) ?? createdDoctorIdRef.current;
      if (doctorId == null || doctorId === "") {
        throw new Error("Doctor ID was not returned after creating doctor");
      }

      for (const sched of selectedSchedules) {
        const schedRes = await fetch(
          "http://qalert-backend.test/api/doctor-schedule",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: adminToken ? `Bearer ${adminToken}` : undefined,
            },
            body: JSON.stringify({
              doctor_id: doctorId,
              // Backend validation error says schedule id field is required.
              // Support both common field names to stay compatible with different backends.
              schedule_id: sched,
              sched,
            }),
          },
        );
        if (!schedRes.ok) {
          let errorMessage = "Failed to assign schedule";
          try {
            const errData = await schedRes.json();
            if (errData?.message) errorMessage = errData.message;
          } catch (_) {
            // Keep fallback message when error body is not JSON.
          }
          throw new Error(errorMessage);
        }
      }
      setDoctorName("");
      setSelectedSchedules([]);
      sileo.success({
        title: "Doctor added successfully",
        description: "Doctor profile and schedules were saved.",
      });
      onDoctorAdded && onDoctorAdded();
      onClose();
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const isStep1 = step === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 shadow-2xl shadow-slate-900/10">
        <div className="flex items-start justify-between px-6 pt-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {isStep1 ? "Add New Doctor" : "Assign Doctor Schedules"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Step {step} of 2 ·{" "}
              {isStep1
                ? "Create the doctor profile to continue."
                : "Choose one or more schedules for this doctor."}
            </p>
          </div>
          {isStep1 && (
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          )}
        </div>

        <div className="px-6 mt-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${
                  step >= 1 ? "bg-[#00968a]" : "bg-slate-200"
                }`}
              />
              <span className={step >= 1 ? "text-[#00968a]" : ""}>
                Create doctor
              </span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${
                  step >= 2 ? "bg-[#00968a]" : "bg-slate-200"
                }`}
              />
              <span className={step >= 2 ? "text-[#00968a]" : ""}>
                Assign schedules
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-5 pt-4">
          {isStep1 && (
            <form onSubmit={handleCreateDoctor} className="flex flex-col gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Doctor name
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#00968a] focus:ring-2 focus:ring-[#00968a]/20 disabled:bg-slate-50"
                  placeholder="e.g. Doc Juan Dela Cruz"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                />
                <p className="text-[11px] text-slate-400">
                  Use the same format you expect patients to see in the app.
                </p>
              </div>
              {error && (
                <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </div>
              )}
              <div className="mt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#00968a] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#00796b] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading || !doctorName.trim()}
                >
                  {loading ? "Checking & creating…" : "Check & create doctor"}
                </button>
              </div>
            </form>
          )}

          {!isStep1 && (
            <form
              onSubmit={handleAssignSchedules}
              className="flex flex-col gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Assign schedules
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Select all time slots this doctor should be available for.
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {selectedSchedules.length} selected
                  </span>
                </div>

                <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50/60">
                  <div className="max-h-44 overflow-y-auto px-3 py-2">
                    {schedules.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No schedules available yet. Create schedules first in
                        the admin panel.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {schedules.map((sched) =>
                          (() => {
                            const schedValue =
                              sched.schedule_id ?? sched.id ?? sched.sched;
                            if (schedValue == null || schedValue === "")
                              return null;
                            return (
                              <label
                                key={
                                  sched.schedule_id ?? sched.id ?? sched.sched
                                }
                                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-700 hover:bg-white"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedSchedules.includes(
                                    schedValue,
                                  )}
                                  onChange={() =>
                                    handleScheduleChange(schedValue)
                                  }
                                  className="h-3.5 w-3.5 accent-[#00968a]"
                                  disabled={loading}
                                />
                                <span className="flex-1">
                                  <span className="font-medium">
                                    {sched.day}
                                  </span>
                                  <span className="mx-1 text-slate-400">•</span>
                                  <span>{sched.shift}</span>
                                </span>
                              </label>
                            );
                          })(),
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {error && (
                <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </div>
              )}
              <div className="mt-1">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#00968a] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#00796b] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading || selectedSchedules.length === 0}
                >
                  {loading ? "Assigning…" : "Assign schedule(s)"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
