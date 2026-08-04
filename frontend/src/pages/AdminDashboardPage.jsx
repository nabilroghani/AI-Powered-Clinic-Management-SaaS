import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import api from "../utils/api.js";

const AdminDashboardPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "doctor"
  });
  const [staffMessage, setStaffMessage] = useState("");
  const [staffError, setStaffError] = useState("");
  const [submittingStaff, setSubmittingStaff] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await api.get("/analytics/admin");
        setAnalytics(response.data?.data || null);
        setPageError("");
      } catch (error) {
        console.error("Failed to fetch admin analytics:", error);
        setPageError(error.response?.data?.message || "Admin analytics could not be loaded.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const handleStaffChange = (event) => {
    setStaffForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
    setStaffMessage("");
    setStaffError("");
  };

  const handleStaffSubmit = async (event) => {
    event.preventDefault();
    setStaffMessage("");
    setStaffError("");

    if (
      !staffForm.name.trim() ||
      !staffForm.email.trim() ||
      !staffForm.password.trim()
    ) {
      setStaffError("Name, email, and password are required.");
      return;
    }

    try {
      setSubmittingStaff(true);
      await api.post("/auth/register", {
        name: staffForm.name.trim(),
        email: staffForm.email.trim(),
        password: staffForm.password,
        role: staffForm.role
      });

      const roleLabel = staffForm.role === "doctor" ? "Doctor" : "Receptionist";
      setStaffMessage(`${roleLabel} account created successfully.`);
      setStaffForm({
        name: "",
        email: "",
        password: "",
        role: "doctor"
      });
    } catch (error) {
      console.error("Failed to create staff account:", error);
      setStaffError(
        error.response?.data?.message || "Staff account could not be created."
      );
    } finally {
      setSubmittingStaff(false);
    }
  };

  const metricCards = analytics
    ? [
        {
          label: "Total Patients",
          value: analytics.summary?.totalPatients ?? 0,
          icon: "🧑"
        },
        {
          label: "Total Doctors",
          value: analytics.summary?.totalDoctors ?? 0,
          icon: "👨‍⚕️"
        },
        {
          label: "Monthly Appointments",
          value: analytics.summary?.totalAppointmentsThisMonth ?? 0,
          icon: "📅"
        },
        {
          label: "Estimated Revenue",
          value: `$${analytics.revenue?.estimatedMonthlyRevenue ?? 0}`,
          icon: "💵"
        }
      ]
    : [];

  return (
    <section className="space-y-6 text-slate-100 font-sans">
      <div className="glass-card rounded-3xl p-8 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
            📊
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-teal-400">
              Admin Organization Suite
            </p>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Clinic Operations & Staff Management
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-xs text-slate-300 leading-relaxed">
          Monitor appointment volume, SaaS revenue, and onboard medical staff (Doctors & Front Desk Receptionists) directly into your clinic directory.
        </p>
      </div>

      {pageError && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 font-medium">
          ⚠️ {pageError}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {(loading ? new Array(4).fill(null) : metricCards).map((item, index) => (
          <article
            key={item?.label || index}
            className="glass-card rounded-3xl p-6 glass-card-hover"
          >
            {loading ? (
              <div className="space-y-3">
                <div className="h-4 w-28 animate-pulse rounded bg-slate-800" />
                <div className="h-8 w-20 animate-pulse rounded bg-slate-800" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-400">{item.label}</p>
                  <span className="text-xl">{item.icon}</span>
                </div>
                <h2 className="mt-3 text-3xl font-extrabold text-white tracking-tight">{item.value}</h2>
              </>
            )}
          </article>
        ))}
      </div>

      {/* Staff Onboarding Form */}
      <div className="glass-card rounded-3xl p-6 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👨‍⚕️</span>
          <div>
            <h2 className="text-lg font-bold text-white">Onboard New Medical Staff</h2>
            <p className="text-xs text-slate-400">
              Add new Doctors or Receptionists to your clinic directory. They can sign in immediately.
            </p>
          </div>
        </div>

        {(staffMessage || staffError) && (
          <div
            className={`mt-4 rounded-xl px-4 py-3 text-xs font-medium ${
              staffMessage
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border border-rose-500/30 bg-rose-500/10 text-rose-300"
            }`}
          >
            {staffMessage ? `✅ ${staffMessage}` : `⚠️ ${staffError}`}
          </div>
        )}

        <form className="mt-6 grid gap-4 md:grid-cols-4" onSubmit={handleStaffSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Staff Role
            </label>
            <select
              name="role"
              value={staffForm.role}
              onChange={handleStaffChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none"
            >
              <option value="doctor">👨‍⚕️ Doctor / Clinician</option>
              <option value="receptionist">📋 Receptionist / Front Desk</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={staffForm.name}
              onChange={handleStaffChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
              placeholder="Dr. John Doe / Sarah Desk"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={staffForm.email}
              onChange={handleStaffChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
              placeholder="staff@clinic.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={staffForm.password}
              onChange={handleStaffChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="md:col-span-4 mt-2">
            <button
              type="submit"
              disabled={submittingStaff}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:brightness-110 disabled:opacity-50"
            >
              {submittingStaff && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              <span>{submittingStaff ? "Onboarding Staff..." : `Add ${staffForm.role === "doctor" ? "Doctor" : "Receptionist"}`}</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default AdminDashboardPage;
