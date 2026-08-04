import { Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "./components/DashboardLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import DoctorDashboardPage from "./pages/DoctorDashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import PatientDashboardPage from "./pages/PatientDashboardPage.jsx";
import ReceptionistDashboardPage from "./pages/ReceptionistDashboardPage.jsx";
import UnauthorizedPage from "./pages/UnauthorizedPage.jsx";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
      </Route>

      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DoctorDashboardPage />} />
      </Route>

      <Route
        path="/receptionist"
        element={
          <ProtectedRoute allowedRoles={["receptionist"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ReceptionistDashboardPage />} />
      </Route>

      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PatientDashboardPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/unauthorized" replace />} />
    </Routes>
  );
};

export default App;
