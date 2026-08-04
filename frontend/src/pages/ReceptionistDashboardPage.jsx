import { useEffect, useState } from "react";

import api from "../utils/api.js";

const initialPatientForm = {
  name: "",
  age: "",
  gender: "",
  contact: ""
};

const initialAppointmentForm = {
  patientId: "",
  doctorId: "",
  date: ""
};

const ReceptionistDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("patients");
  const [patientForm, setPatientForm] = useState(initialPatientForm);
  const [appointmentForm, setAppointmentForm] = useState(initialAppointmentForm);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [submittingPatient, setSubmittingPatient] = useState(false);
  const [submittingAppointment, setSubmittingAppointment] = useState(false);
  const [pageError, setPageError] = useState("");
  const [patientMessage, setPatientMessage] = useState("");
  const [appointmentMessage, setAppointmentMessage] = useState("");
  const [latestCredentials, setLatestCredentials] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const response = await api.get("/patients?limit=8&page=1");
      setPatients(response.data?.data || []);
      setPageError("");
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      setPageError(error.response?.data?.message || "Unable to load patients right now.");
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const response = await api.get("/users/doctors");
      setDoctors(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
      setPageError(error.response?.data?.message || "Unable to load the doctors directory.");
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

  const handlePatientChange = (event) => {
    setPatientForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
    setPatientMessage("");
    setCopyMessage("");
  };

  const handleAppointmentChange = (event) => {
    setAppointmentForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
    setAppointmentMessage("");
  };

  const handleCreatePatient = async (event) => {
    event.preventDefault();
    setPatientMessage("");

    if (
      !patientForm.name.trim() ||
      !patientForm.age ||
      !patientForm.gender.trim() ||
      !patientForm.contact.trim()
    ) {
      setPatientMessage("Please complete every patient registration field.");
      return;
    }

    try {
      setSubmittingPatient(true);
      const response = await api.post("/patients", {
        ...patientForm,
        age: Number(patientForm.age)
      });

      const createdPatient = response.data?.data?.patient;
      const generatedEmail = response.data?.data?.email || "";
      const generatedPassword = response.data?.data?.password || "";
      setPatients((current) => [createdPatient, ...current].slice(0, 8));
      setPatientForm(initialPatientForm);
      setPatientMessage("Patient registered successfully.");
      setLatestCredentials({
        patientName: createdPatient?.name || "",
        email: generatedEmail,
        password: generatedPassword
      });
      setCopyMessage("");
      setActiveTab("appointments");
      setAppointmentForm((current) => ({
        ...current,
        patientId: createdPatient?._id || current.patientId
      }));
    } catch (error) {
      console.error("Failed to register patient:", error);
      setPatientMessage(error.response?.data?.message || "Patient registration failed.");
    } finally {
      setSubmittingPatient(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!latestCredentials) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        `Email: ${latestCredentials.email}\nPassword: ${latestCredentials.password}`
      );
      setCopyMessage("Patient portal credentials copied successfully.");
    } catch (error) {
      console.error("Failed to copy credentials:", error);
      setCopyMessage("Patient portal credentials could not be copied.");
    }
  };

  const handleBookAppointment = async (event) => {
    event.preventDefault();
    setAppointmentMessage("");

    if (
      !appointmentForm.patientId.trim() ||
      !appointmentForm.doctorId.trim() ||
      !appointmentForm.date
    ) {
      setAppointmentMessage("Please provide a patient, doctor, and appointment time.");
      return;
    }

    try {
      setSubmittingAppointment(true);
      const response = await api.post("/appointments", appointmentForm);
      const createdAppointment = response.data?.data;

      setRecentAppointments((current) => [createdAppointment, ...current].slice(0, 6));
      setAppointmentForm(initialAppointmentForm);
      setAppointmentMessage("Appointment booked successfully.");
    } catch (error) {
      console.error("Failed to book appointment:", error);
      setAppointmentMessage(error.response?.data?.message || "Appointment booking failed.");
    } finally {
      setSubmittingAppointment(false);
    }
  };

  return (
    <section className="space-y-6 text-slate-100 font-sans">
      <div className="glass-card rounded-3xl p-8 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30 text-lg">
            📋
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-teal-400">
              Front Desk Operations
            </p>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Patient Intake & Appointment Coordination
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-xs text-slate-300 leading-relaxed">
          Register new patients, issue portal access credentials, and coordinate daily appointments with the clinical team.
        </p>
      </div>

      {pageError && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 font-medium">
          ⚠️ {pageError}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-card rounded-3xl p-6 backdrop-blur-2xl">
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab("patients")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "patients"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              📝 Patient Intake Form
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("appointments")}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "appointments"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              📅 Book Appointment Form
            </button>
          </div>

          {activeTab === "patients" ? (
            <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleCreatePatient}>
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Patient Full Name</span>
                <input
                  type="text"
                  name="name"
                  value={patientForm.name}
                  onChange={handlePatientChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                  placeholder="Enter full name"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Age</span>
                <input
                  type="number"
                  min="0"
                  name="age"
                  value={patientForm.age}
                  onChange={handlePatientChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                  placeholder="32"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Gender</span>
                <input
                  type="text"
                  name="gender"
                  value={patientForm.gender}
                  onChange={handlePatientChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                  placeholder="Male, Female, or Other"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Contact (Phone or Email)</span>
                <input
                  type="text"
                  name="contact"
                  value={patientForm.contact}
                  onChange={handlePatientChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                  placeholder="Phone number or email address"
                />
              </label>

              {patientMessage && (
                <div
                  className={`md:col-span-2 rounded-xl px-4 py-3 text-xs font-medium ${
                    patientMessage.includes("successfully")
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border border-amber-500/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {patientMessage}
                </div>
              )}

              {latestCredentials && (
                <div className="md:col-span-2 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 backdrop-blur-md">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1.5 text-xs text-slate-200">
                      <p className="font-bold text-white text-sm">
                        🔑 Patient Portal Login Access for {latestCredentials.patientName}
                      </p>
                      <p>
                        <span className="font-semibold text-teal-300">Portal Email:</span>{" "}
                        {latestCredentials.email}
                      </p>
                      <p>
                        <span className="font-semibold text-teal-300">Portal Password:</span>{" "}
                        {latestCredentials.password}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCredentials}
                      className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition-all hover:brightness-110"
                    >
                      📋 Copy Credentials
                    </button>
                  </div>

                  {copyMessage && (
                    <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                      {copyMessage}
                    </div>
                  )}
                </div>
              )}

              <div className="md:col-span-2 mt-2">
                <button
                  type="submit"
                  disabled={submittingPatient}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {submittingPatient && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  <span>{submittingPatient ? "Registering Patient..." : "Register Patient & Issue Access"}</span>
                </button>
              </div>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleBookAppointment}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Select Patient</label>
                <select
                  name="patientId"
                  value={appointmentForm.patientId}
                  onChange={handleAppointmentChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                >
                  <option value="">Select registered patient</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name} | {patient.contact}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Select Doctor</label>
                <select
                  name="doctorId"
                  value={appointmentForm.doctorId}
                  onChange={handleAppointmentChange}
                  disabled={loadingDoctors}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                >
                  <option value="">
                    {loadingDoctors ? "Loading doctors..." : "Select attending doctor"}
                  </option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.name} | {doctor.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Appointment Date &amp; Time
                  </label>
                  <span className="text-[11px] text-teal-400 font-medium">1-Click Quick Presets:</span>
                </div>

                {/* Quick Date Presets */}
                <div className="flex flex-wrap gap-2 mb-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setHours(10, 0, 0, 0);
                      const formatted = d.toISOString().slice(0, 16);
                      setAppointmentForm((prev) => ({ ...prev, date: formatted }));
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-indigo-500 hover:text-white transition-all"
                  >
                    ⚡ Today 10:00 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setHours(14, 0, 0, 0);
                      const formatted = d.toISOString().slice(0, 16);
                      setAppointmentForm((prev) => ({ ...prev, date: formatted }));
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-indigo-500 hover:text-white transition-all"
                  >
                    ⚡ Today 02:00 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      d.setHours(10, 0, 0, 0);
                      const formatted = d.toISOString().slice(0, 16);
                      setAppointmentForm((prev) => ({ ...prev, date: formatted }));
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-indigo-500 hover:text-white transition-all"
                  >
                    ⚡ Tomorrow 10:00 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      d.setHours(16, 0, 0, 0);
                      const formatted = d.toISOString().slice(0, 16);
                      setAppointmentForm((prev) => ({ ...prev, date: formatted }));
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-indigo-500 hover:text-white transition-all"
                  >
                    ⚡ Tomorrow 04:00 PM
                  </button>
                </div>

                <input
                  type="datetime-local"
                  name="date"
                  value={appointmentForm.date}
                  onChange={handleAppointmentChange}
                  style={{ colorScheme: "dark" }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none cursor-pointer"
                />
              </div>

              {appointmentMessage && (
                <div
                  className={`rounded-xl px-4 py-3 text-xs font-medium ${
                    appointmentMessage.includes("successfully")
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border border-amber-500/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {appointmentMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={submittingAppointment}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:brightness-110 disabled:opacity-50 mt-2"
              >
                {submittingAppointment && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                <span>{submittingAppointment ? "Booking Appointment..." : "Schedule Appointment"}</span>
              </button>
            </form>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>🧑</span> Recent Patients
              </h2>
              <button
                type="button"
                onClick={fetchPatients}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {loadingPatients ? (
                <p className="text-xs text-slate-400">Loading patients...</p>
              ) : patients.length === 0 ? (
                <p className="text-xs text-slate-400">No patients registered yet.</p>
              ) : (
                patients.map((patient) => (
                  <div
                    key={patient._id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                  >
                    <p className="font-bold text-white text-xs">{patient.name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {patient.gender} | {patient.age} yrs | {patient.contact}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 backdrop-blur-2xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>📅</span> Session Booked Appointments
            </h2>
            <div className="mt-4 space-y-2.5">
              {recentAppointments.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Newly booked appointments will appear here.
                </p>
              ) : (
                recentAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                  >
                    <p className="font-bold text-white text-xs">
                      {appointment.patientId?.name || "Patient Record"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {new Date(appointment.date).toLocaleString()} |{" "}
                      Doctor: {appointment.doctorId?.name || "Assigned Doctor"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReceptionistDashboardPage;
