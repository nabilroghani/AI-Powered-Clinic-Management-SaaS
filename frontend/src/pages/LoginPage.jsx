import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";

const landingByRole = {
  admin: "/admin",
  doctor: "/doctor",
  receptionist: "/receptionist",
  patient: "/patient"
};

const demoAccounts = [
  { role: "Doctor", email: "doctor@clinic.com", pass: "password123", icon: "🩺", desc: "Consultations & AI Triage" },
  { role: "Admin", email: "admin@clinic.com", pass: "password123", icon: "👑", desc: "Staff & SaaS Analytics" },
  { role: "Receptionist", email: "receptionist@clinic.com", pass: "password123", icon: "📋", desc: "Patient Intake & Booking" },
  { role: "Patient", email: "patient@clinic.com", pass: "password123", icon: "🧑", desc: "Medical Records & AI Explainer" }
];

const LoginPage = () => {
  const location = useLocation();
  const { login, loading, authError, user, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [selectedRole, setSelectedRole] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  if (isAuthenticated && user?.role) {
    return <Navigate to={landingByRole[user.role] || "/unauthorized"} replace />;
  }

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
    setFieldError("");
    setSubmitError("");
  };

  const fillDemoAccount = (acc) => {
    setForm({ email: acc.email, password: acc.pass });
    setSelectedRole(acc.role);
    setFieldError("");
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    if (!form.email.trim() || !form.password.trim()) {
      setFieldError("Email and password are required.");
      return;
    }

    const result = await login(form.email.trim(), form.password);

    if (!result.success) {
      setSubmitError(result.message);
      return;
    }

    const fallbackPath = landingByRole[result.user?.role] || "/unauthorized";
    const redirectPath = location.state?.from?.pathname || fallbackPath;

    navigate(redirectPath, { replace: true });
  };

  const handleSeedUsers = async () => {
    try {
      setSeeding(true);
      setSeedMessage("");
      const response = await api.get("/auth/seed-test-users");
      setSeedMessage(response.data?.message || "Test users reset successfully to password123!");
    } catch (error) {
      console.error("Seed request failed:", error);
      setSeedMessage(
        error.response?.data?.message || "Test users could not be prepared right now."
      );
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/70 via-slate-950 to-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Brand Hero Panel */}
        <div className="lg:col-span-6 relative flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950 p-6 sm:p-10">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-teal-400 to-emerald-400 font-black text-slate-950 shadow-xl shadow-indigo-500/30 text-2xl">
                  ⚡
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-teal-400">
                    MedPulse SaaS
                  </p>
                  <h1 className="text-lg font-bold text-white tracking-tight">
                    AI Clinic Platform
                  </h1>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                Live DB RAG AI
              </div>
            </div>

            <div className="mt-8">
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                🏥 Multi-Role Healthcare Ecosystem
              </span>
              <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
                Next-Gen Medical Operations &amp; Grounded Gemini AI.
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Streamlining patient intake, clinician consultation, PDF prescriptions, and real-time MongoDB clinical intelligence.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { icon: "🩺", text: "AI Symptom Triage" },
                { icon: "🇵🇰", text: "Urdu & EN Explainer" },
                { icon: "📄", text: "Official PDF Bills" },
                { icon: "📊", text: "SaaS Analytics & DB" }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs font-semibold text-slate-200"
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Demo Credentials</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Default password for all roles: <code className="text-teal-300 font-bold">password123</code></p>
              </div>
              <button
                type="button"
                onClick={handleSeedUsers}
                disabled={seeding}
                className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition-all hover:brightness-110 disabled:opacity-50 shadow-md shadow-teal-500/20"
              >
                {seeding ? "Resetting..." : "⚡ Reset Passwords"}
              </button>
            </div>

            {seedMessage && (
              <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 font-medium">
                ✅ {seedMessage}
              </div>
            )}
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-6 flex flex-col justify-center p-6 sm:p-10 bg-slate-900/60">
          <div className="mx-auto w-full max-w-md">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold text-white tracking-tight">Sign In to Workspace</h2>
              <p className="mt-1 text-xs text-slate-400">Click a demo role card below for instant authentication.</p>
            </div>

            {/* 1-Click Role Login Selector */}
            <div className="mt-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-2.5">
                ⚡ 1-Click Role Login Presets
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {demoAccounts.map((acc) => {
                  const isSelected = selectedRole === acc.role;
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => fillDemoAccount(acc)}
                      className={`flex flex-col justify-between rounded-2xl border p-3 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-600/25 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/40"
                          : "border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-lg">{acc.icon}</span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${isSelected ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400"}`}>
                          {acc.role}
                        </span>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs font-bold text-white">{acc.role} Portal</p>
                        <p className="text-[10px] text-slate-400 truncate">{acc.email}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {(fieldError || submitError || authError) && (
              <div className="mt-5 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 font-medium">
                ⚠️ {fieldError || submitError || authError}
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  placeholder="doctor@clinic.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 pr-10 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-all text-sm p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-teal-500 to-emerald-500 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 transition-all hover:brightness-110 disabled:opacity-50"
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                <span>{loading ? "Authenticating..." : "Sign In Securely"}</span>
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-slate-400">
                New Clinic Administrator?{" "}
                <Link to="/register" className="font-bold text-teal-400 hover:underline">
                  Register Organization
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
