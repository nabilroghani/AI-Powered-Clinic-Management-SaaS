import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";

const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
    subscriptionPlan: "Pro"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/register", {
        ...form,
        role: "admin"
      });

      if (res.data?.success) {
        setSuccessMsg("Clinic Admin account created! Logging you into Admin Portal...");
        const loginRes = await login(form.email.trim(), form.password);
        if (loginRes.success) {
          navigate("/admin", { replace: true });
        } else {
          navigate("/login");
        }
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 font-sans">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/90 p-8 sm:p-12 shadow-2xl backdrop-blur-2xl">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-400 font-extrabold text-white text-xl shadow-lg shadow-indigo-500/30">
              ⚡
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-teal-400">MedPulse SaaS</p>
              <h1 className="text-lg font-bold text-white tracking-tight">Register Clinic Organization</h1>
            </div>
          </div>
          <Link
            to="/login"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            ← Back to Login
          </Link>
        </div>

        <div className="mt-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-xs text-indigo-200 leading-relaxed">
          🏢 <span className="font-bold text-white">Clinic Admin Registration</span>: As a Clinic Admin, you can onboard Doctors, Receptionists, manage patient workflows, and monitor SaaS analytics.
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 font-medium">
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300 font-medium">
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Clinic Admin Full Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              placeholder="Dr. Admin / Manager Name"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Admin Email Address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              placeholder="admin@yourclinic.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 pr-10 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                SaaS Subscription
              </label>
              <select
                name="subscriptionPlan"
                value={form.subscriptionPlan}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              >
                <option value="Pro">Pro Plan (Full AI Diagnosis Unlocked)</option>
                <option value="Free">Free Plan</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:brightness-110 disabled:opacity-50 mt-2"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            <span>{loading ? "Registering Admin..." : "Register Clinic Admin & Launch Dashboard"}</span>
          </button>

          <div className="text-center pt-3">
            <p className="text-xs text-slate-400">
              Already registered?{" "}
              <Link to="/login" className="font-bold text-teal-400 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
