import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

const LoadingSpinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <div className="glass-card flex items-center gap-3 rounded-2xl border border-white/60 px-6 py-5 shadow-soft">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-clinic-600 border-t-transparent" />
      <p className="text-sm font-medium text-slate-700">Loading your secure workspace...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, loading, token } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
