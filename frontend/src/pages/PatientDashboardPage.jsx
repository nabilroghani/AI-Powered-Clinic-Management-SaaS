import { useEffect, useRef, useState } from "react";
import html2pdf from "html2pdf.js";

import { useAuth } from "../context/AuthContext.jsx";
import { useSubscription } from "../context/SubscriptionContext.jsx";
import api from "../utils/api.js";

const PatientDashboardPage = () => {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [appointmentHistory, setAppointmentHistory] = useState({ upcoming: [], past: [] });
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [explanationById, setExplanationById] = useState({});
  const [loadingExplainId, setLoadingExplainId] = useState("");
  const [downloadingPdfId, setDownloadingPdfId] = useState("");
  const prescriptionRefs = useRef({});

  useEffect(() => {
    const fetchPatientPortalData = async () => {
      if (!user?.patientProfile) {
        setLoading(false);
        setPageError("Your account is not linked to a patient profile yet.");
        return;
      }

      try {
        setLoading(true);
        const [appointmentsResponse, historyResponse] = await Promise.all([
          api.get(`/appointments/patient/${user.patientProfile}/history`),
          api.get(`/prescriptions/history/${user.patientProfile}`)
        ]);

        setAppointmentHistory(appointmentsResponse.data?.data || { upcoming: [], past: [] });
        setPrescriptions(historyResponse.data?.data?.prescriptions || []);
        setPageError("");
      } catch (error) {
        console.error("Failed to load patient portal data:", error);
        setPageError(
          error.response?.data?.message ||
            "Your medical portal data could not be loaded at this time."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPatientPortalData();
  }, [user?.patientProfile]);

  const [selectedLanguage, setSelectedLanguage] = useState("English");

  const handleExplainPrescription = async (prescriptionId, language = selectedLanguage) => {
    try {
      setLoadingExplainId(prescriptionId);
      const response = await api.post(`/prescriptions/ai-explain/${prescriptionId}`, {
        language
      });

      setExplanationById((current) => ({
        ...current,
        [prescriptionId]: response.data?.data?.explanation || null
      }));
    } catch (error) {
      console.error("Failed to explain prescription:", error);
      setExplanationById((current) => ({
        ...current,
        [prescriptionId]: {
          error:
            error.response?.data?.message || "The AI explanation could not be generated."
        }
      }));
    } finally {
      setLoadingExplainId("");
    }
  };

  const downloadPrescriptionPDF = async (prescription) => {
    try {
      setDownloadingPdfId(prescription._id);
      
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
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 24px;">
          <div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px;">⚡ MedPulse Care</h1>
            <p style="margin: 4px 0 0; font-size: 13px; font-weight: 600; color: #0d9488; text-transform: uppercase; letter-spacing: 1.5px;">Official Clinical Prescription & Guidance</p>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            <p style="margin: 0;"><strong>Date:</strong> ${new Date(prescription.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 4px 0 0;"><strong>Rx ID:</strong> #${prescription._id.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; background: #f1f5f9; padding: 16px; border-radius: 12px; font-size: 13px;">
          <div>
            <p style="margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700;">Patient Details</p>
            <p style="margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #0f172a;">${prescription.patientId?.name || "Patient Record"}</p>
            <p style="margin: 2px 0 0; color: #475569;">Email: ${prescription.patientId?.portalEmail || prescription.patientId?.contact || "N/A"}</p>
          </div>
          <div>
            <p style="margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700;">Attending Clinician</p>
            <p style="margin: 4px 0 0; font-size: 15px; font-weight: 700; color: #0f172a;">${prescription.doctorId?.name || "Assigned Doctor"}</p>
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
                <th style="padding: 10px 12px;">Special Directions</th>
              </tr>
            </thead>
            <tbody>
              ${medicinesRows}
            </tbody>
          </table>
        </div>

        <div style="margin-bottom: 28px; background: #fffbe6; border: 1px solid #fde047; padding: 16px; border-radius: 12px;">
          <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #854d0e;">📋 Special Instructions & Dosage Advice</p>
          <p style="margin: 0; font-size: 13px; color: #713f12; leading-height: 1.5;">${prescription.instructions || "Take all medicines as prescribed with meals unless specified otherwise."}</p>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; pt: 20px; border-t: 1px solid #cbd5e1;">
          <div style="font-size: 11px; color: #94a3b8; max-width: 400px;">
            <p style="margin: 0;">✔ Official digital record generated via MedPulse SaaS Platform.</p>
            <p style="margin: 4px 0 0;">Strictly for clinical use. Consult clinician if symptoms persist.</p>
          </div>
          <div style="text-align: center; border-top: 1px solid #0f172a; width: 180px; padding-top: 6px;">
            <p style="margin: 0; font-size: 12px; font-weight: 700; color: #0f172a;">${prescription.doctorId?.name || "Attending Doctor"}</p>
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
      setDownloadingPdfId("");
    }
  };

  return (
    <section className="space-y-6 text-slate-100 font-sans">
      <div className="glass-card rounded-3xl p-8 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30 text-lg">
            🧑
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-teal-400">
              Patient Medical Portal
            </p>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              My Health Record & Gemini AI Explainer
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-xs text-slate-300 leading-relaxed">
          Track active prescriptions, review your appointment timeline, and generate AI-powered prescription explanations in English or Urdu (اردو).
        </p>
      </div>

      {pageError && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 font-medium">
          ⚠️ {pageError}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        {/* Appointments Column */}
        <div className="glass-card rounded-3xl p-6 backdrop-blur-2xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📅</span> Appointment Timeline
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Upcoming visits and past consultation history.
          </p>

          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400">
                Upcoming Visits
              </h3>
              <div className="mt-3 space-y-3">
                {loading ? (
                  <p className="text-xs text-slate-400">Loading appointments...</p>
                ) : appointmentHistory.upcoming?.length ? (
                  appointmentHistory.upcoming.map((appointment) => (
                    <div
                      key={appointment._id}
                      className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4"
                    >
                      <p className="font-semibold text-white text-sm">
                        {new Date(appointment.date).toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-slate-300">
                        Doctor: <span className="text-teal-300 font-medium">{appointment.doctorId?.name || "Assigned Doctor"}</span>
                      </p>
                      <span className="mt-2 inline-block rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                        {appointment.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
                    No upcoming appointments scheduled.
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Past Consultations
              </h3>
              <div className="mt-3 space-y-3">
                {loading ? null : appointmentHistory.past?.length ? (
                  appointmentHistory.past.map((appointment) => (
                    <div key={appointment._id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="font-semibold text-white text-sm">
                        {new Date(appointment.date).toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Doctor: {appointment.doctorId?.name || "Assigned Doctor"}
                      </p>
                      <span className="mt-2 inline-block rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {appointment.status}
                      </span>
                    </div>
                  ))
                ) : (
                  !loading && (
                    <p className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
                      No past consultations recorded.
                    </p>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Prescriptions & AI Explainer Column */}
        <div className="glass-card rounded-3xl p-6 backdrop-blur-2xl">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>💊</span> Prescriptions & Gemini Explainer
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Download official PDF prescriptions & generate 1-Click AI explanations in English or Urdu.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-xs text-slate-400">Loading prescriptions...</p>
            ) : prescriptions.length === 0 ? (
              <p className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
                No prescriptions available yet.
              </p>
            ) : (
              prescriptions.map((prescription) => {
                const explanation = explanationById[prescription._id];
                const isExplainingThis = loadingExplainId === prescription._id;

                return (
                  <div
                    key={prescription._id}
                    className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-5 backdrop-blur-md"
                    ref={(element) => {
                      prescriptionRefs.current[prescription._id] = element;
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-white text-sm">
                          Issued on {new Date(prescription.createdAt).toLocaleDateString()}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-300">
                          Doctor: <span className="text-teal-300 font-semibold">{prescription.doctorId?.name || "Assigned Doctor"}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => downloadPrescriptionPDF(prescription)}
                          disabled={downloadingPdfId === prescription._id}
                          className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition-all hover:brightness-110 disabled:opacity-50"
                        >
                          {downloadingPdfId === prescription._id
                            ? "Generating PDF..."
                            : "📄 Download PDF"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExplainPrescription(prescription._id, "English")}
                          disabled={isExplainingThis}
                          className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-3 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-all hover:brightness-110 disabled:opacity-50"
                        >
                          {isExplainingThis ? "AI Explaining..." : "🇬🇧 AI Explain (EN)"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExplainPrescription(prescription._id, "Urdu")}
                          disabled={isExplainingThis}
                          className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-teal-600/30 transition-all hover:brightness-110 disabled:opacity-50"
                        >
                          {isExplainingThis ? "AI Explaining..." : "🇵🇰 AI Explain (اردو)"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Prescribed Medicines
                      </p>
                      <div className="space-y-2">
                        {prescription.medicines.map((medicine, index) => (
                          <div key={`${prescription._id}-${medicine.name}-${index}`} className="rounded-xl border border-slate-700/50 bg-slate-950/60 px-3.5 py-2.5 text-xs text-slate-200">
                            <span className="font-bold text-teal-300">{medicine.name}</span>
                            {" | "}
                            <span className="text-indigo-300 font-medium">{medicine.dosage}</span>
                            {" | "}
                            <span>{medicine.duration}</span>
                            {medicine.notes ? <span className="text-slate-400"> ({medicine.notes})</span> : ""}
                          </div>
                        ))}
                      </div>
                    </div>

                    {prescription.instructions && (
                      <div className="mt-3 rounded-xl border border-slate-700/50 bg-slate-950/60 px-3.5 py-2.5 text-xs text-slate-300">
                        <span className="font-bold text-white">Instructions:</span> {prescription.instructions}
                      </div>
                    )}

                    {explanation && (
                      <div className="mt-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-xs text-slate-200 backdrop-blur-md">
                        {"error" in explanation ? (
                          <p className="text-rose-300 font-medium">⚠️ {explanation.error}</p>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 font-bold text-indigo-300 text-sm pb-2 border-b border-indigo-500/20">
                              <span>🤖 Gemini AI Explanation ({explanation.language || selectedLanguage})</span>
                            </div>
                            
                            <div className="mt-3 leading-relaxed text-slate-200">
                              <p className="font-bold text-white mb-1">AI Care Summary:</p>
                              <p>{explanation.summary}</p>
                            </div>

                            {explanation.lifestyleAdvice?.length > 0 && (
                              <div className="mt-3">
                                <p className="font-bold text-teal-300 mb-1">💡 Lifestyle Advice:</p>
                                <ul className="space-y-1 pl-4 list-disc text-slate-300">
                                  {explanation.lifestyleAdvice.map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {explanation.preventiveTips?.length > 0 && (
                              <div className="mt-3">
                                <p className="font-bold text-amber-300 mb-1">🛡️ Preventive Tips:</p>
                                <ul className="space-y-1 pl-4 list-disc text-slate-300">
                                  {explanation.preventiveTips.map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PatientDashboardPage;
