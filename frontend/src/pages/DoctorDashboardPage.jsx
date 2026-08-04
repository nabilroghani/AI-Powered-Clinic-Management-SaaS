import { useEffect, useState } from "react";
import html2pdf from "html2pdf.js";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { useAuth } from "../context/AuthContext.jsx";
import { useSubscription } from "../context/SubscriptionContext.jsx";
import api from "../utils/api.js";

const createMedicineItem = () => ({
  id: `medicine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  dosage: "",
  duration: "",
  notes: ""
});

const initialDiagnosisForm = {
  patientId: "",
  symptoms: "",
  age: "",
  gender: ""
};

const initialPrescriptionForm = {
  patientId: "",
  instructions: "",
  medicines: [createMedicineItem()]
};

const riskStyles = {
  Low: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 glow-emerald",
  Medium: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  High: "bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold"
};

const DoctorDashboardPage = () => {
  const { user } = useAuth();
  const { isPro, plan } = useSubscription();
  const [patients, setPatients] = useState([]);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().slice(0, 10));
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [diagnosisForm, setDiagnosisForm] = useState(initialDiagnosisForm);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [diagnosisMessage, setDiagnosisMessage] = useState("");
  const [runningDiagnosis, setRunningDiagnosis] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState(initialPrescriptionForm);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [prescriptionMessage, setPrescriptionMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const [latestSavedPrescription, setLatestSavedPrescription] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  
  // Persistent Doctor Records & Analytics State
  const [doctorRecords, setDoctorRecords] = useState({
    prescriptions: [],
    diagnosisLogs: [],
    appointments: [],
    stats: {
      totalPrescriptions: 0,
      totalAppointments: 0,
      todayAppointmentsCount: 0,
      todayPrescriptionsCount: 0
    }
  });
  const [loadingDoctorRecords, setLoadingDoctorRecords] = useState(true);
  const [selectedPatientTimeline, setSelectedPatientTimeline] = useState(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const response = await api.get("/patients?limit=100&page=1");
      setPatients(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      setPageError(error.response?.data?.message || "Unable to load patient records.");
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchAppointments = async (selectedDate) => {
    try {
      setLoadingAppointments(true);
      const response = await api.get(`/appointments/doctor/${user.id}/schedule`, {
        params: { date: selectedDate }
      });
      setAppointments(response.data?.data || []);
      setPageError("");
    } catch (error) {
      console.error("Failed to fetch doctor schedule:", error);
      setPageError(error.response?.data?.message || "Unable to load appointments.");
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchDoctorRecords = async () => {
    try {
      setLoadingDoctorRecords(true);
      const response = await api.get("/prescriptions/doctor");
      setDoctorRecords(
        response.data?.data || {
          prescriptions: [],
          diagnosisLogs: [],
          appointments: [],
          stats: {}
        }
      );
    } catch (error) {
      console.error("Failed to fetch doctor records:", error);
    } finally {
      setLoadingDoctorRecords(false);
    }
  };

  const fetchPatientTimeline = async (patientId) => {
    try {
      setLoadingTimeline(true);
      setTimelineModalOpen(true);
      const response = await api.get(`/prescriptions/history/${patientId}`);
      setSelectedPatientTimeline(response.data?.data || null);
    } catch (error) {
      console.error("Failed to fetch patient timeline:", error);
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    fetchPatients();
    fetchAppointments(scheduleDate);
    fetchDoctorRecords();
  }, [user?.id]);

  const handleScheduleFilter = async (event) => {
    const nextDate = event.target.value;
    setScheduleDate(nextDate);
    if (user?.id) {
      fetchAppointments(nextDate);
    }
  };

  const handleDiagnosisChange = (event) => {
    setDiagnosisForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
    setDiagnosisMessage("");
  };

  const handlePrescriptionMetaChange = (event) => {
    setPrescriptionForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
    setPrescriptionMessage("");
  };

  const handleMedicineChange = (index, event) => {
    setPrescriptionForm((current) => {
      const medicines = [...current.medicines];
      medicines[index] = {
        ...medicines[index],
        [event.target.name]: event.target.value
      };

      return {
        ...current,
        medicines
      };
    });
    setPrescriptionMessage("");
  };

  const addMedicine = () => {
    setPrescriptionForm((current) => ({
      ...current,
      medicines: [...current.medicines, createMedicineItem()]
    }));
  };

  const removeMedicine = (index) => {
    setPrescriptionForm((current) => ({
      ...current,
      medicines:
        current.medicines.length === 1
          ? current.medicines
          : current.medicines.filter((_, medicineIndex) => medicineIndex !== index)
    }));
  };

  const handleRunDiagnosis = async (event) => {
    event.preventDefault();
    setDiagnosisMessage("");

    if (!diagnosisForm.symptoms.trim()) {
      setDiagnosisMessage("Describe the patient's symptoms before running diagnosis.");
      return;
    }

    try {
      setRunningDiagnosis(true);
      const response = await api.post("/prescriptions/ai-diagnose", {
        ...diagnosisForm,
        age: Number(diagnosisForm.age),
        patientId: diagnosisForm.patientId || undefined
      });

      setDiagnosisResult(response.data?.data?.analysis || null);
      setDiagnosisMessage("Smart diagnosis completed successfully.");
      fetchDoctorRecords();
    } catch (error) {
      console.error("Smart diagnosis failed:", error);
      setDiagnosisMessage(
        error.response?.data?.message || "Smart diagnosis could not be completed."
      );
      setDiagnosisResult(null);
    } finally {
      setRunningDiagnosis(false);
    }
  };

  const handleSavePrescription = async (event) => {
    event.preventDefault();
    setPrescriptionMessage("");

    const hasInvalidMedicine = prescriptionForm.medicines.some(
      (medicine) =>
        !medicine.name.trim() || !medicine.dosage.trim() || !medicine.duration.trim()
    );

    if (
      !prescriptionForm.patientId ||
      !prescriptionForm.instructions.trim() ||
      hasInvalidMedicine
    ) {
      setPrescriptionMessage(
        "Select a patient, add prescription instructions, and complete every medicine entry."
      );
      return;
    }

    try {
      setSavingPrescription(true);
      const response = await api.post("/prescriptions", prescriptionForm);
      setPrescriptionMessage("Prescription saved successfully.");
      setLatestSavedPrescription(response.data?.data || null);
      setPrescriptionForm({
        patientId: "",
        instructions: "",
        medicines: [createMedicineItem()]
      });
      fetchDoctorRecords();
    } catch (error) {
      console.error("Failed to save prescription:", error);
      setPrescriptionMessage(
        error.response?.data?.message || "Prescription could not be saved."
      );
    } finally {
      setSavingPrescription(false);
    }
  };

  const downloadPrescriptionPDF = async (prescription) => {
    try {
      setDownloadingPdf(true);

      const exportWrapper = document.createElement("div");
      exportWrapper.style.padding = "40px";
      exportWrapper.style.background = "#ffffff";
      exportWrapper.style.color = "#0f172a";
      exportWrapper.style.fontFamily = "'Plus Jakarta Sans', Arial, sans-serif";
      exportWrapper.style.width = "800px";

      const medicinesRows = prescription.medicines
        ?.map(
          (med, idx) => `
            <tr style="background: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'}; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px; font-weight: 700; color: #1e293b;">${med.name}</td>
              <td style="padding: 12px; color: #475569;">${med.dosage}</td>
              <td style="padding: 12px; color: #475569;">${med.duration}</td>
              <td style="padding: 12px; color: #64748b; font-size: 12px;">${med.notes || "As directed"}</td>
            </tr>
          `
        )
        .join("");

      exportWrapper.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 24px;">
          <div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px;">⚡ MedPulse Medical Center</h1>
            <p style="margin: 4px 0 0; font-size: 13px; font-weight: 600; color: #0d9488; text-transform: uppercase; letter-spacing: 1.5px;">Smart AI Diagnostics & Clinical Consultation</p>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            <p style="margin: 0;"><strong>Date:</strong> ${new Date(prescription.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 4px 0 0;"><strong>Rx ID:</strong> #${prescription._id.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; background: #f1f5f9; padding: 16px; border-radius: 12px; font-size: 13px;">
          <div>
            <p style="margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700;">Patient Info</p>
            <p style="margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #0f172a;">${prescription.patientId?.name || "Patient Record"}</p>
            <p style="margin: 2px 0 0; color: #475569;">Email / Contact: ${prescription.patientId?.portalEmail || prescription.patientId?.contact || "N/A"}</p>
          </div>
          <div>
            <p style="margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700;">Attending Clinician</p>
            <p style="margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #0f172a;">${prescription.doctorId?.name || user?.name || "Attending Clinician"}</p>
            <p style="margin: 2px 0 0; color: #0d9488; font-weight: 600;">License: PMDC-REG-${prescription._id.slice(-5)}</p>
          </div>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; color: #334155; font-weight: 700; letter-spacing: 0.5px;">Rx Prescribed Medications</h3>
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #e2e8f0; color: #334155; font-size: 11px; text-transform: uppercase;">
                <th style="padding: 10px 12px;">Medication</th>
                <th style="padding: 10px 12px;">Dosage</th>
                <th style="padding: 10px 12px;">Duration</th>
                <th style="padding: 10px 12px;">Directions</th>
              </tr>
            </thead>
            <tbody>
              ${medicinesRows}
            </tbody>
          </table>
        </div>

        <div style="margin-bottom: 24px; background: #fffbe6; border: 1px solid #fde047; padding: 16px; border-radius: 12px;">
          <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #854d0e;">📋 Special Dosage & Care Instructions</p>
          <p style="margin: 0; font-size: 13px; color: #713f12;">${prescription.instructions || "Take all medicines as prescribed. Drink plenty of water and rest."}</p>
        </div>

        <div style="margin-bottom: 24px; background: #e0f2fe; border: 1px solid #7dd3fc; padding: 14px; border-radius: 12px; font-size: 12px; color: #0369a1;">
          <p style="margin: 0 0 4px; font-weight: 700;">🔑 Patient Portal Access Credentials:</p>
          <p style="margin: 0;">Portal Email: <strong>${prescription.patientId?.portalEmail || "patient@clinic.com"}</strong> | Password: <strong>${prescription.patientId?.portalPassword || "password123"}</strong></p>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px solid #cbd5e1;">
          <div style="font-size: 11px; color: #94a3b8; max-width: 400px;">
            <p style="margin: 0;">✔ Verified Clinical Record - MedPulse AI Cloud Platform.</p>
            <p style="margin: 4px 0 0;">Consult clinician if adverse reactions occur.</p>
          </div>
          <div style="text-align: center; border-top: 1px solid #0f172a; width: 180px; padding-top: 6px;">
            <p style="margin: 0; font-size: 12px; font-weight: 700; color: #0f172a;">${prescription.doctorId?.name || user?.name || "Attending Doctor"}</p>
            <p style="margin: 2px 0 0; font-size: 10px; color: #64748b;">Authorized Signature</p>
          </div>
        </div>
      `;

      await html2pdf()
        .set({
          margin: 0.3,
          filename: `prescription-${prescription._id}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
        })
        .from(exportWrapper)
        .save();
    } catch (error) {
      console.error("Failed to export prescription PDF:", error);
      setPageError(error.message || "The prescription PDF could not be generated.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

    const appCount =
      doctorRecords.appointments?.filter(
        (app) => new Date(app.date).toISOString().slice(0, 10) === dateStr
      ).length || 0;

    const rxCount =
      doctorRecords.prescriptions?.filter(
        (p) => new Date(p.createdAt).toISOString().slice(0, 10) === dateStr
      ).length || 0;

    return {
      name: `${dayName} ${d.getDate()}`,
      Consultations: appCount,
      Prescriptions: rxCount
    };
  });

  return (
    <section className="space-y-6 text-slate-100 font-sans pb-10">
      {/* Top Banner & Stats Overview */}
      <div className="glass-card rounded-3xl p-8 backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30 text-xl shadow-lg">
              🩺
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-teal-400">
                Doctor Command Console
              </p>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Clinical Workflow, AI Triage &amp; Persistent Patient Records
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchDoctorRecords}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-all"
          >
            🔄 Sync Persistent DB Records
          </button>
        </div>

        {/* Doctor Summary Stat Pills */}
        <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Today's Patients
            </p>
            <p className="mt-1 text-2xl font-extrabold text-teal-300">
              {doctorRecords.stats?.todayAppointmentsCount || appointments.length || 0}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Prescriptions Issued Today
            </p>
            <p className="mt-1 text-2xl font-extrabold text-indigo-300">
              {doctorRecords.stats?.todayPrescriptionsCount || 0}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Consultations Logged
            </p>
            <p className="mt-1 text-2xl font-extrabold text-white">
              {doctorRecords.stats?.totalAppointments || appointments.length || 0}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Prescriptions Saved
            </p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-400">
              {doctorRecords.stats?.totalPrescriptions || doctorRecords.prescriptions?.length || 0}
            </p>
          </div>
        </div>
      </div>

      {pageError && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 font-medium">
          ⚠️ {pageError}
        </div>
      )}

      {/* Recharts Patient Analytics Chart */}
      <div className="glass-card rounded-3xl p-6 backdrop-blur-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>📊</span> Weekly Patient Consultation &amp; Prescription Trends
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Visual analytics generated dynamically from MongoDB records.
            </p>
          </div>
        </div>

        <div className="mt-5 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorConsultations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#fff"
                }}
              />
              <Area
                type="monotone"
                dataKey="Consultations"
                stroke="#14b8a6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorConsultations)"
              />
              <Area
                type="monotone"
                dataKey="Prescriptions"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRx)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        
        {/* Today's Appointments Column */}
        <div className="glass-card rounded-3xl p-6 backdrop-blur-2xl">
          <div className="pb-4 border-b border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📅</span> Doctor Schedule
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Filter schedule by consultation date.
                </p>
              </div>
              <input
                type="date"
                value={scheduleDate}
                onChange={handleScheduleFilter}
                style={{ colorScheme: "dark" }}
                className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
              />
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().slice(0, 10);
                  setScheduleDate(today);
                  fetchAppointments(today);
                }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  scheduleDate === new Date().toISOString().slice(0, 10)
                    ? "bg-indigo-600 text-white shadow-md"
                    : "border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const tom = new Date();
                  tom.setDate(tom.getDate() + 1);
                  const tomorrowStr = tom.toISOString().slice(0, 10);
                  setScheduleDate(tomorrowStr);
                  fetchAppointments(tomorrowStr);
                }}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-indigo-500 hover:text-white transition-all"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => {
                  const yest = new Date();
                  yest.setDate(yest.getDate() - 1);
                  const yestStr = yest.toISOString().slice(0, 10);
                  setScheduleDate(yestStr);
                  fetchAppointments(yestStr);
                }}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-indigo-500 hover:text-white transition-all"
              >
                Yesterday
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {loadingAppointments ? (
              <p className="text-xs text-slate-400">Loading appointments...</p>
            ) : appointments.length === 0 ? (
              <p className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
                No appointments scheduled for this date.
              </p>
            ) : (
              appointments.map((appointment) => (
                <div key={appointment._id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white text-sm">
                        {appointment.patientId?.name || "Patient record"}
                      </p>
                      <p className="mt-0.5 text-xs text-teal-400 font-medium">
                        🕒 {new Date(appointment.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchPatientTimeline(appointment.patientId?._id || appointment.patientId)}
                      className="rounded-lg bg-slate-800 px-2 py-1 text-[10px] font-bold text-indigo-300 hover:text-white border border-slate-700"
                    >
                      🔍 Timeline
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {appointment.patientId?.gender} | {appointment.patientId?.age} years
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Gemini AI Diagnosis Column */}
        <div className="glass-card relative overflow-hidden rounded-3xl p-6 backdrop-blur-2xl">
          <div className={!isPro ? "pointer-events-none select-none blur-[2px] opacity-45" : ""}>
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🤖</span> Gemini AI Triage
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Real-time differential diagnosis assist.
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  isPro ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 glow-emerald" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {plan} Plan
              </span>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleRunDiagnosis}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Select Patient</label>
                <select
                  name="patientId"
                  value={diagnosisForm.patientId}
                  onChange={handleDiagnosisChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                >
                  <option value="">Select patient context</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Symptoms</label>
                <textarea
                  name="symptoms"
                  value={diagnosisForm.symptoms}
                  onChange={handleDiagnosisChange}
                  rows="3"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                  placeholder="e.g. high fever, cough, chest tightness"
                />
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Age</label>
                  <input
                    type="number"
                    min="0"
                    name="age"
                    value={diagnosisForm.age}
                    onChange={handleDiagnosisChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Gender</label>
                  <input
                    type="text"
                    name="gender"
                    value={diagnosisForm.gender}
                    onChange={handleDiagnosisChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {diagnosisMessage && (
                <div
                  className={`rounded-xl px-4 py-3 text-xs font-medium ${
                    diagnosisMessage.includes("successfully")
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border border-amber-500/30 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {diagnosisMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={runningDiagnosis || !isPro}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-500 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:brightness-110 disabled:opacity-50"
              >
                {runningDiagnosis && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                <span>{runningDiagnosis ? "Analyzing with Gemini AI..." : "⚡ Run Gemini AI Triage"}</span>
              </button>
            </form>

            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                AI Diagnosis Output
              </h3>
              {diagnosisResult ? (
                <div className="mt-3 space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Risk Level:</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        riskStyles[diagnosisResult.riskLevel] || "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {diagnosisResult.riskLevel}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-teal-300 mb-1">Possible Conditions:</p>
                    <ul className="space-y-1 pl-4 list-disc text-slate-200">
                      {diagnosisResult.possibleConditions?.map((condition) => (
                        <li key={condition}>{condition}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-300 mb-1">Suggested Tests:</p>
                    <ul className="space-y-1 pl-4 list-disc text-slate-200">
                      {diagnosisResult.suggestedTests?.map((test) => (
                        <li key={test}>{test}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  No AI analysis run yet in this session.
                </p>
              )}
            </div>
          </div>

          {!isPro && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-md">
              <div className="max-w-sm rounded-2xl border border-amber-500/30 bg-slate-900 p-6 text-center shadow-2xl">
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                  Pro Feature
                </span>
                <h3 className="mt-4 text-base font-bold text-white">
                  Unlock Smart Diagnosis AI
                </h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Upgrade to Pro to enable real-time Gemini AI symptom triage and differential diagnosis.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Prescription Constructor Column */}
        <div className="glass-card rounded-3xl p-6 backdrop-blur-2xl lg:col-span-2 xl:col-span-1">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>📄</span> Prescription Generator
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Build &amp; export official PDF prescriptions.
            </p>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSavePrescription}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Select Patient</label>
              <select
                name="patientId"
                value={prescriptionForm.patientId}
                onChange={handlePrescriptionMetaChange}
                disabled={loadingPatients}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
              >
                <option value="">{loadingPatients ? "Loading patients..." : "Select registered patient"}</option>
                {patients.map((patient) => (
                  <option key={patient._id} value={patient._id}>
                    {patient.name} | {patient.contact}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              {prescriptionForm.medicines.map((medicine, index) => (
                <div key={medicine.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
                    <h3 className="text-xs font-bold text-teal-300">Medication #{index + 1}</h3>
                    {prescriptionForm.medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicine(index)}
                        className="text-[11px] font-semibold text-rose-400 hover:text-rose-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-2 grid-cols-2">
                    <input
                      type="text"
                      name="name"
                      value={medicine.name}
                      onChange={(event) => handleMedicineChange(index, event)}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                      placeholder="Medicine name"
                    />
                    <input
                      type="text"
                      name="dosage"
                      value={medicine.dosage}
                      onChange={(event) => handleMedicineChange(index, event)}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                      placeholder="Dosage (e.g. 500mg)"
                    />
                    <input
                      type="text"
                      name="duration"
                      value={medicine.duration}
                      onChange={(event) => handleMedicineChange(index, event)}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                      placeholder="Duration (e.g. 5 days)"
                    />
                    <input
                      type="text"
                      name="notes"
                      value={medicine.notes}
                      onChange={(event) => handleMedicineChange(index, event)}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                      placeholder="Notes (e.g. after meals)"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addMedicine}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              ➕ Add Another Medication
            </button>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Special Instructions</label>
              <textarea
                name="instructions"
                value={prescriptionForm.instructions}
                onChange={handlePrescriptionMetaChange}
                rows="3"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                placeholder="Care &amp; follow-up instructions"
              />
            </div>

            {prescriptionMessage && (
              <div
                className={`rounded-xl px-4 py-3 text-xs font-medium ${
                  prescriptionMessage.includes("successfully")
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border border-amber-500/30 bg-amber-500/10 text-amber-300"
                }`}
              >
                {prescriptionMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={savingPrescription}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-500 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:brightness-110 disabled:opacity-50"
            >
              {savingPrescription && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              <span>{savingPrescription ? "Saving Prescription..." : "Save Prescription Record"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Persistent Issued Prescriptions History Table (Saved in MongoDB) */}
      <div className="glass-card rounded-3xl p-6 backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>📋</span> Persistent Issued Prescriptions Log (Saved in Database)
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              All prescriptions created by you stored permanently in MongoDB. Page refresh will never lose records!
            </p>
          </div>
          <button
            type="button"
            onClick={fetchDoctorRecords}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Refresh Records
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          {loadingDoctorRecords ? (
            <p className="text-xs text-slate-400">Loading saved prescriptions...</p>
          ) : doctorRecords.prescriptions?.length === 0 ? (
            <p className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
              No prescriptions recorded yet. New prescriptions will automatically save here!
            </p>
          ) : (
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Portal Access Email</th>
                  <th className="py-3 px-4">Prescribed Medicines</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {doctorRecords.prescriptions.map((prescription) => (
                  <tr key={prescription._id} className="hover:bg-slate-800/30 transition-all">
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {new Date(prescription.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {prescription.patientId?.name || "Patient Record"}
                    </td>
                    <td className="py-3 px-4 text-teal-300">
                      {prescription.patientId?.portalEmail || "N/A"}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate">
                      {prescription.medicines?.map((m) => `${m.name} (${m.dosage})`).join(", ")}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => downloadPrescriptionPDF(prescription)}
                        className="rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1.5 text-[11px] font-bold hover:bg-teal-500/30 transition-all"
                      >
                        📄 Download PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => fetchPatientTimeline(prescription.patientId?._id || prescription.patientId)}
                        className="rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 text-[11px] font-bold hover:bg-indigo-500/30 transition-all"
                      >
                        🔍 Full Timeline
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Patient History Modal Drawer */}
      {timelineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📂</span> Patient Medical Record &amp; Clinical Timeline
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedPatientTimeline?.patient?.name || "Patient Record"} | Gender: {selectedPatientTimeline?.patient?.gender} | Age: {selectedPatientTimeline?.patient?.age}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTimelineModalOpen(false)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            {loadingTimeline ? (
              <p className="text-xs text-slate-400">Loading patient history...</p>
            ) : selectedPatientTimeline?.timeline?.length === 0 ? (
              <p className="text-xs text-slate-400">No medical history found for this patient.</p>
            ) : (
              <div className="space-y-3">
                {selectedPatientTimeline?.timeline?.map((item, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
                      <span className="font-bold text-teal-300 uppercase tracking-wider text-[10px]">
                        {item.type}
                      </span>
                      <span className="text-slate-400">
                        {new Date(item.date).toLocaleString()}
                      </span>
                    </div>

                    {item.type === "prescription" && (
                      <div className="space-y-1">
                        <p className="font-bold text-white">Prescribed Medicines:</p>
                        <ul className="list-disc pl-4 text-slate-300">
                          {item.record?.medicines?.map((m, i) => (
                            <li key={i}>{m.name} - {m.dosage} ({m.duration})</li>
                          ))}
                        </ul>
                        <p className="mt-2 text-slate-400">Instructions: {item.record?.instructions}</p>
                      </div>
                    )}

                    {item.type === "appointment" && (
                      <div>
                        <p className="font-bold text-white">Status: {item.record?.status}</p>
                        <p className="text-slate-400">Doctor: {item.record?.doctorId?.name}</p>
                      </div>
                    )}

                    {item.type === "diagnosisLog" && (
                      <div className="space-y-1">
                        <p className="font-bold text-white">Symptoms: {item.record?.symptoms}</p>
                        <p className="text-amber-300">Risk Level: {item.record?.riskLevel}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default DoctorDashboardPage;
