import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppLayout } from "./layout/AppLayout";

import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DoctorsPage } from "./pages/DoctorsPage";
import { PatientsPage } from "./pages/PatientsPage";
import { DiagnosesPage } from "./pages/DiagnosesPage";
import { ExaminationsPage } from "./pages/ExaminationsPage";
import { SickLeavesPage } from "./pages/SickLeavesPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { HealthInsuranceRecordsPage } from "./pages/HealthInsuranceRecordsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="diagnoses" element={<DiagnosesPage />} />
        <Route path="examinations" element={<ExaminationsPage />} />
        <Route path="sick-leaves" element={<SickLeavesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="health-insurance-records" element={<HealthInsuranceRecordsPage />}/>

        <Route
          path="admin/users"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}