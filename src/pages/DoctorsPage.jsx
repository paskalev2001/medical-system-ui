import { useEffect, useState } from "react";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthContext";
import { getErrorMessage } from "../utils/error";

const emptyForm = {
  uniqueIdentifier: "",
  fullName: "",
  specialty: "GENERAL_PRACTITIONER",
  generalPractitioner: false,
  userId: "",
};

export function DoctorsPage() {
  const { hasRole } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  async function loadDoctors() {
    const response = await http.get("/doctors");
    setDoctors(response.data);
  }

  useEffect(() => {
    loadDoctors().catch((err) =>
      setError(getErrorMessage(err, "Could not load doctors."))
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

  function startEdit(doctor) {
    setEditingId(doctor.id);
    setForm({
      uniqueIdentifier: doctor.uniqueIdentifier,
      fullName: doctor.fullName,
      specialty: doctor.specialty,
      generalPractitioner: doctor.generalPractitioner,
      userId: doctor.userId ?? "",
    });
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const payload = {
      ...form,
      userId: form.userId ? Number(form.userId) : null,
    };

    try {
      if (editingId) {
        await http.put(`/doctors/${editingId}`, payload);
      } else {
        await http.post("/doctors", payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadDoctors();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save doctor."));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this doctor?")) return;

    try {
      await http.delete(`/doctors/${id}`);
      await loadDoctors();
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete doctor."));
    }
  }

  return (
    <div>
      <h2>Doctors</h2>

      {error && <div className="alert error">{error}</div>}

      {hasRole("ADMIN") && (
        <form className="card form-grid" onSubmit={handleSubmit}>
          <h3>{editingId ? "Edit doctor" : "Create doctor"}</h3>

          <label>
            Unique identifier
            <input
              name="uniqueIdentifier"
              value={form.uniqueIdentifier}
              onChange={handleChange}
              placeholder="DOC-001"
            />
          </label>

          <label>
            Full name
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Dr. Ivan Ivanov"
            />
          </label>

          <label>
            Specialty
            <select
              name="specialty"
              value={form.specialty}
              onChange={handleChange}
            >
              <option value="GENERAL_PRACTITIONER">GENERAL_PRACTITIONER</option>
              <option value="CARDIOLOGY">CARDIOLOGY</option>
              <option value="NEUROLOGY">NEUROLOGY</option>
              <option value="ORTHOPEDICS">ORTHOPEDICS</option>
              <option value="PEDIATRICS">PEDIATRICS</option>
              <option value="DERMATOLOGY">DERMATOLOGY</option>
              <option value="ENDOCRINOLOGY">ENDOCRINOLOGY</option>
              <option value="OTHER">OTHER</option>
            </select>
          </label>

          <label>
            User ID
            <input
              name="userId"
              value={form.userId}
              onChange={handleChange}
              placeholder="Optional user id"
            />
          </label>

          <label className="checkbox-row">
            <input
              name="generalPractitioner"
              type="checkbox"
              checked={form.generalPractitioner}
              onChange={handleChange}
            />
            Can be general practitioner
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
        <h3>All doctors</h3>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Identifier</th>
              <th>Name</th>
              <th>Specialty</th>
              <th>GP</th>
              <th>User ID</th>
              {hasRole("ADMIN") && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {doctors.map((doctor) => (
              <tr key={doctor.id}>
                <td>{doctor.id}</td>
                <td>{doctor.uniqueIdentifier}</td>
                <td>{doctor.fullName}</td>
                <td>{doctor.specialty}</td>
                <td>{doctor.generalPractitioner ? "Yes" : "No"}</td>
                <td>{doctor.userId ?? "-"}</td>

                {hasRole("ADMIN") && (
                  <td>
                    <button
                      className="button secondary"
                      onClick={() => startEdit(doctor)}
                    >
                      Edit
                    </button>

                    <button
                      className="button secondary"
                      onClick={() => handleDelete(doctor.id)}
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

        {doctors.length === 0 && <p className="muted">No doctors found.</p>}
      </div>
    </div>
  );
}