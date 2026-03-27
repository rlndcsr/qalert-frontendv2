import React, { useEffect, useState } from "react";

export default function DoctorsTab() {
  const [doctors, setDoctors] = useState([]);
  const [doctorSchedules, setDoctorSchedules] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get admin token from localStorage
        const adminToken =
          typeof window !== "undefined"
            ? localStorage.getItem("adminToken")
            : null;
        const doctorRes = await fetch(
          "http://qalert-backend.test/api/doctors",
          {
            headers: { Accept: "application/json" },
          },
        );
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
    fetchAll();
  }, []);

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
                  <button className="mt-4 w-full px-3 py-1 rounded border border-teal-200 text-teal-700 bg-teal-50 text-xs font-medium hover:bg-teal-100 transition-colors hover:cursor-pointer">
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
        </div>
      )}
    </div>
  );
}
