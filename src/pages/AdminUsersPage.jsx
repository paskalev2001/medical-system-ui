import { useEffect, useState } from "react";
import { http } from "../api/http";
import { getErrorMessage } from "../utils/error";

const emptyForm = {
  username: "",
  email: "",
  password: "",
  role: "PATIENT",
  enabled: true,
};

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordUserId, setPasswordUserId] = useState(null);
  const [error, setError] = useState("");

  async function loadUsers() {
    const response = await http.get("/admin/users");
    setUsers(response.data);
  }

  useEffect(() => {
    loadUsers().catch((err) =>
      setError(getErrorMessage(err, "Could not load users."))
    );
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  function startEdit(user) {
    setEditingId(user.id);
    setForm({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
      enabled: user.enabled,
    });
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      if (editingId) {
        await http.put(`/admin/users/${editingId}`, {
          username: form.username,
          email: form.email,
          role: form.role,
          enabled: form.enabled,
        });
      } else {
        await http.post("/admin/users", form);
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save user."));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this user?")) return;

    try {
      await http.delete(`/admin/users/${id}`);
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete user."));
    }
  }

  async function handlePasswordChange(event) {
    event.preventDefault();

    if (!passwordUserId) return;

    try {
      await http.patch(`/admin/users/${passwordUserId}/password`, {
        password: newPassword,
      });

      setPasswordUserId(null);
      setNewPassword("");
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, "Could not change password."));
    }
  }

  return (
    <div>
      <h2>Admin Users</h2>

      {error && <div className="alert error">{error}</div>}

      <form className="card form-grid" onSubmit={handleSubmit}>
        <h3>{editingId ? "Edit user" : "Create user"}</h3>

        <label>
          Username
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="doctor1"
          />
        </label>

        <label>
          Email
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="doctor1@test.com"
          />
        </label>

        {!editingId && (
          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="123456"
            />
          </label>
        )}

        <label>
          Role
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="ADMIN">ADMIN</option>
            <option value="DOCTOR">DOCTOR</option>
            <option value="PATIENT">PATIENT</option>
          </select>
        </label>

        <label className="checkbox-row">
          <input
            name="enabled"
            type="checkbox"
            checked={form.enabled}
            onChange={handleChange}
          />
          Enabled
        </label>

        <div>
          <button className="button" type="submit">
            {editingId ? "Update" : "Create"}
          </button>

          {editingId && (
            <button
              className="button secondary"
              type="button"
              onClick={startCreate}
              style={{ marginLeft: 8 }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {passwordUserId && (
        <form className="card form-grid" onSubmit={handlePasswordChange}>
          <h3>Change password for user #{passwordUserId}</h3>

          <label>
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="newpassword123"
            />
          </label>

          <div>
            <button className="button" type="submit">
              Change password
            </button>

            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setPasswordUserId(null);
                setNewPassword("");
              }}
              style={{ marginLeft: 8 }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card">
        <h3>All users</h3>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Enabled</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.enabled ? "Yes" : "No"}</td>
                <td>
                  <button
                    className="button secondary"
                    onClick={() => startEdit(user)}
                  >
                    Edit
                  </button>

                  <button
                    className="button secondary"
                    onClick={() => {
                      setPasswordUserId(user.id);
                      setNewPassword("");
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    Password
                  </button>

                  <button
                    className="button secondary"
                    onClick={() => handleDelete(user.id)}
                    style={{ marginLeft: 8 }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && <p className="muted">No users found.</p>}
      </div>
    </div>
  );
}