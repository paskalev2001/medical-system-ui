import { useEffect, useState } from "react";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthContext";
import { getErrorMessage } from "../utils/error";

const emptyForm = {
  code: "",
  name: "",
  description: "",
};

export function DiagnosesPage() {
  const { hasRole } = useAuth();

  const [diagnoses, setDiagnoses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  async function loadDiagnoses() {
    const response = await http.get("/diagnoses");
    setDiagnoses(response.data);
  }

  useEffect(() => {
    loadDiagnoses().catch((err) =>
      setError(getErrorMessage(err, "Could not load diagnoses."))
    );
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  function startEdit(diagnosis) {
    setEditingId(diagnosis.id);
    setForm({
      code: diagnosis.code ?? "",
      name: diagnosis.name,
      description: diagnosis.description ?? "",
    });
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const payload = {
      code: form.code || null,
      name: form.name,
      description: form.description || null,
    };

    try {
      if (editingId) {
        await http.put(`/diagnoses/${editingId}`, payload);
      } else {
        await http.post("/diagnoses", payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadDiagnoses();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save diagnosis."));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this diagnosis?")) return;

    try {
      await http.delete(`/diagnoses/${id}`);
      await loadDiagnoses();
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete diagnosis."));
    }
  }

  return (
    <div>
      <h2>Diagnoses</h2>

      {error && <div className="alert error">{error}</div>}

      {hasRole("ADMIN") && (
        <form className="card form-grid" onSubmit={handleSubmit}>
          <h3>{editingId ? "Edit diagnosis" : "Create diagnosis"}</h3>

          <label>
            Code
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="I10"
            />
          </label>

          <label>
            Name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Hypertension"
            />
          </label>

          <label style={{ gridColumn: "1 / -1" }}>
            Description
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="High blood pressure"
            />
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
      )}

      <div className="card">
        <h3>All diagnoses</h3>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Code</th>
              <th>Name</th>
              <th>Description</th>
              {hasRole("ADMIN") && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {diagnoses.map((diagnosis) => (
              <tr key={diagnosis.id}>
                <td>{diagnosis.id}</td>
                <td>{diagnosis.code ?? "-"}</td>
                <td>{diagnosis.name}</td>
                <td>{diagnosis.description ?? "-"}</td>

                {hasRole("ADMIN") && (
                  <td>
                    <button
                      className="button secondary"
                      onClick={() => startEdit(diagnosis)}
                    >
                      Edit
                    </button>

                    <button
                      className="button secondary"
                      onClick={() => handleDelete(diagnosis.id)}
                      style={{ marginLeft: 8 }}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {diagnoses.length === 0 && (
          <p className="muted">No diagnoses found.</p>
        )}
      </div>
    </div>
  );
}