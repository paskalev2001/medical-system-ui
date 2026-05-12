import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function AppLayout() {
  const { currentUser, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">M</div>
          <div>
            <h1>Medical System</h1>
            <p>Electronic medical record</p>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/">Dashboard</NavLink>

          {(hasRole("ADMIN") || hasRole("DOCTOR")) && (
            <>
              <NavLink to="/doctors">Doctors</NavLink>
              <NavLink to="/patients">Patients</NavLink>
              <NavLink to="/diagnoses">Diagnoses</NavLink>
              <NavLink to="/examinations">Examinations</NavLink>
              <NavLink to="/sick-leaves">Sick Leaves</NavLink>
              <NavLink to="/reports">Reports</NavLink>
              <NavLink to="/health-insurance-records">Health Insurance</NavLink>
            </>
          )}

          {hasRole("PATIENT") && (
            <>
              <NavLink to="/examinations">My Examinations</NavLink>
              <NavLink to="/sick-leaves">My Sick Leaves</NavLink>
            </>
          )}

          {hasRole("ADMIN") && <NavLink to="/admin/users">Admin Users</NavLink>}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <strong>{currentUser?.username}</strong>
            <span className="role-badge">{currentUser?.role}</span>
          </div>

          <button className="button secondary" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}