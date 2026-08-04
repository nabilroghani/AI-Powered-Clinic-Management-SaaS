import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { useSubscription } from "../context/SubscriptionContext.jsx";
import AntigravityAiWidget from "./AntigravityAiWidget.jsx";

const navigationByRole = {
  admin: [
    { label: "Overview", path: "/admin" },
    { label: "Doctors Management", path: "/admin#doctors" },
    { label: "SaaS Analytics", path: "/admin#analytics", pro: true }
  ],
  doctor: [
    { label: "Clinical Dashboard", path: "/doctor" },
    { label: "Daily Schedule", path: "/doctor#schedule" },
    { label: "Prescriptions", path: "/doctor#prescriptions" },
    { label: "Smart AI Diagnosis", path: "/doctor#smart-diagnosis", pro: true }
  ],
  receptionist: [
    { label: "Desk Dashboard", path: "/receptionist" },
    { label: "Bookings Queue", path: "/receptionist#bookings" },
    { label: "Patient Registry", path: "/receptionist#patients" }
  ],
  patient: [
    { label: "Patient Portal", path: "/patient" },
    { label: "My Appointments", path: "/patient#appointments" },
    { label: "Medical History", path: "/patient#prescriptions" },
    { label: "AI Explainer", path: "/patient#ai-explanation", pro: true }
  ]
};

const planBadgeClasses = {
  Pro: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 glow-emerald",
  Free: "bg-amber-500/20 text-amber-300 border border-amber-500/30"
};

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { isPro, plan } = useSubscription();
  const navigate = useNavigate();

  const navigationItems = navigationByRole[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 font-sans">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-2xl px-6 py-6 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r flex flex-col justify-between z-30">
          <div>
            {/* Clinic Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-400 font-bold text-white shadow-lg shadow-indigo-500/30">
                ⚡
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-teal-400">MedPulse SaaS</p>
                <h1 className="text-lg font-bold text-white tracking-tight">Smart Clinic Suite</h1>
              </div>
            </div>

            {/* User Profile Card */}
            <div className="mt-6 rounded-xl border border-slate-700/60 bg-slate-800/50 p-3.5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <p className="text-sm font-semibold text-white truncate max-w-[120px]">{user?.name}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    planBadgeClasses[plan] || planBadgeClasses.Free
                  }`}
                >
                  {plan}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 capitalize pl-5">{user?.role} Portal</p>
            </div>

            {!isPro && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200/90 leading-relaxed">
                🚀 Upgrade to <span className="font-bold text-amber-300">Pro Plan</span> for unlimited Gemini AI Triage & Urdu explainer.
              </div>
            )}

            {/* Navigation */}
            <nav className="mt-6 flex flex-wrap gap-1.5 lg:flex-col lg:space-y-1">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 font-semibold"
                        : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    }`
                  }
                >
                  <span>{item.label}</span>
                  {item.pro && (
                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/30">
                      AI Pro
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-all duration-200 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40"
            >
              🚪 Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex min-h-screen w-full flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-800/60 bg-slate-900/70 backdrop-blur-2xl px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400">
                  Medical Command Center
                </p>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  Welcome back, <span className="bg-gradient-to-r from-teal-300 to-indigo-300 bg-clip-text text-transparent">{user?.name}</span>
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 sm:flex">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Live DB RAG AI Active</span>
                </div>

                <div className="hidden rounded-xl border border-slate-700/60 bg-slate-800/50 px-3.5 py-1.5 text-xs font-medium text-slate-300 md:block">
                  Role: <span className="text-teal-300 font-semibold capitalize">{user?.role}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg bg-rose-600/80 px-3 py-1.5 text-xs font-semibold text-white lg:hidden"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="w-full flex-1 px-4 py-6 sm:px-8 max-w-7xl mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <AntigravityAiWidget />
    </div>
  );
};

export default DashboardLayout;
