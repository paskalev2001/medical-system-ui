import { useEffect, useState } from "react";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthContext";
import { getErrorMessage } from "../utils/error";
import { UserSearchSelect } from "../components/UserSearchSelect";

const emptyForm = {
  fullName: "",
  egn: "",
  generalPractitionerId: "",
  userId: "",
};

export function PatientsPage() {
  const { hasRole } = useAuth();

  const [patients, setPatients] = useState([]);
  const [generalPractitioners, setGeneralPractitioners] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  async function loadPatients() {
    const response = await http.get("/patients");
    setPatients(response.data);
  }

  async function loadGeneralPractitioners() {
    const response = await http.get("/doctors/general-practitioners");
    setGeneralPractitioners(response.data);
  }

  useEffect(() => {
    Promise.all([loadPatients(), loadGeneralPractitioners()]).catch((err) =>
      setError(getErrorMessage(err, "Could not load patients."))
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

  function startEdit(patient) {
    setEditingId(patient.id);
    setForm({
      fullName: patient.fullName,
      egn: patient.egn,
      generalPractitionerId: patient.generalPractitioner?.id ?? "",
      userId: patient.userId ?? "",
    });
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const payload = {
      fullName: form.fullName,
      egn: form.egn,
      generalPractitionerId: Number(form.generalPractitionerId),
      userId: form.userId ? Number(form.userId) : null,
    };

    try {
      if (editingId) {
        await http.put(`/patients/${editingId}`, payload);
      } else {
        await http.post("/patients", payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadPatients();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save patient."));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this patient?")) return;

    try {
      await http.delete(`/patients/${id}`);
      await loadPatients();
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete patient."));
    }
  }

  return (
    <div>
      <h2>Patients</h2>

      {error && <div className="alert error">{error}</div>}

      {hasRole("ADMIN") && (
        <form className="card form-grid" onSubmit={handleSubmit}>
          <h3>{editingId ? "Edit patient" : "Create patient"}</h3>

          <label>
            Full name
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Petar Petrov"
            />
          </label>

          <label>
            EGN
            <input
              name="egn"
              value={form.egn}
              onChange={handleChange}
              placeholder="9001011234"
            />
          </label>

          <label>
            General practitioner
            <select
              name="generalPractitionerId"
              value={form.generalPractitionerId}
              onChange={handleChange}
            >
              <option value="">Select GP</option>
              {generalPractitioners.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  #{doctor.id} {doctor.fullName}
                </option>
              ))}
            </select>
          </label>

          <UserSearchSelect
            label="Linked patient user"
            role="PATIENT"
            value={form.userId}
            onChange={(userId) =>
                setForm((prev) => ({
                ...prev,
                userId,
                }))
            }
            />

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
        <h3>All patients</h3>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Full name</th>
              <th>EGN</th>
              <th>General practitioner</th>
              <th>User ID</th>
              {hasRole("ADMIN") && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td>{patient.id}</td>
                <td>{patient.fullName}</td>
                <td>{patient.egn}</td>
                <td>
                  {patient.generalPractitioner
                    ? patient.generalPractitioner.fullName
                    : "-"}
                </td>
                <td>{patient.userId ?? "-"}</td>

                {hasRole("ADMIN") && (
                  <td>
                    <button
                      className="button secondary"
                      onClick={() => startEdit(patient)}
                    >
                      Edit
                    </button>

                    <button
                      className="button secondary"
                      onClick={() => handleDelete(patient.id)}
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

        {patients.length === 0 && <p className="muted">No patients found.</p>}
      </div>
    </div>
  );
}