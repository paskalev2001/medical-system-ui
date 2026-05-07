import { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";

export function UserSearchSelect({ value, onChange, role, label = "User" }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await http.get("/admin/users");
        setUsers(response.data);
      } catch (err) {
        setError("Could not load users.");
      }
    }

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase().trim();

    return users
      .filter((user) => !role || user.role === role)
      .filter((user) => {
        if (!query) return true;

        return (
          String(user.id).includes(query) ||
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        );
      });
  }, [users, role, search]);

  return (
    <label>
      {label}

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by username, email or ID"
      />

      <select
        value={value ?? ""}
        onChange={(event) => {
          const selectedValue = event.target.value;
          onChange(selectedValue ? Number(selectedValue) : "");
        }}
      >
        <option value="">No linked user</option>

        {filteredUsers.map((user) => (
          <option key={user.id} value={user.id}>
            #{user.id} | {user.username} | {user.email}
          </option>
        ))}
      </select>

      {error && <small className="field-error">{error}</small>}
    </label>
  );
}