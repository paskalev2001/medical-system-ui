import { useAuth } from "../auth/AuthContext";

export function DashboardPage() {
  const { currentUser } = useAuth();

  return (
    <div>
      <h2>Dashboard</h2>
      <p className="muted">
        Welcome, {currentUser?.username}. You are logged in as{" "}
        <strong>{currentUser?.role}</strong>.
      </p>

      <div className="grid">
        <div className="card">
          <h3>Patients</h3>
          <p>Manage patient records and medical history.</p>
        </div>

        <div className="card">
          <h3>Examinations</h3>
          <p>Create and review medical examinations.</p>
        </div>

        <div className="card">
          <h3>Reports</h3>
          <p>View statistics and medical reports.</p>
        </div>
      </div>
    </div>
  );
}