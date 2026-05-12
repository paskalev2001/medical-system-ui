import { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthContext";
import { EntitySearchSelect } from "../components/EntitySearchSelect";
import { getErrorMessage } from "../utils/error";

const emptyForm = {
  patientId: "",
  month: "",
  insured: true,
};

export function HealthInsuranceRecordsPage() {
  const { hasRole } = useAuth();

  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [filterPatientId, setFilterPatientId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canWrite = hasRole("ADMIN");
  const canReadAll = hasRole("ADMIN", "DOCTOR");

  const filteredRecords = useMemo(() => {
    if (!filterPatientId) return records;

    return records.filter(
      (record) => String(record.patientId) === String(filterPatientId)
    );
  }, [records, filterPatientId]);

  async function loadRecords() {
    const response = await http.get("/health-insurance-records");
    setRecords(response.data);
  }

  async function loadPatients() {
    const response = await http.get("/patients");
    setPatients(response.data);
  }

  useEffect(() => {
    if (!canReadAll) return;

    Promise.all([loadRecords(), loadPatients()]).catch((err) =>
      setError(getErrorMessage(err, "Could not load health insurance records."))
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
    setSuccess("");
  }

  function startEdit(record) {
    setEditingId(record.id);
    setForm({
      patientId: record.patientId,
      month: record.month,
      insured: record.insured,
    });
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const payload = {
      patientId: Number(form.patientId),
      month: form.month,
      insured: form.insured,
    };

    try {
      if (editingId) {
        await http.put(`/health-insurance-records/${editingId}`, payload);
        setSuccess("Health insurance record updated.");
      } else {
        await http.post("/health-insurance-records", payload);
        setSuccess("Health insurance record created.");
      }

      startCreate();
      await loadRecords();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save health insurance record."));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this health insurance record?")) return;

    setError("");
    setSuccess("");

    try {
      await http.delete(`/health-insurance-records/${id}`);
      setSuccess("Health insurance record deleted.");
      await loadRecords();
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete health insurance record."));
    }
  }

  function getLastSixMonths() {
    const months = [];

    const now = new Date();

    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");

      months.push(`${year}-${month}`);
    }

    return months.reverse();
  }

  async function createLastSixMonthsInsured() {
    if (!form.patientId) {
      setError("Please select a patient first.");
      return;
    }

    setError("");
    setSuccess("");

    const months = getLastSixMonths();

    try {
      for (const month of months) {
        await http.post("/health-insurance-records", {
          patientId: Number(form.patientId),
          month,
          insured: true,
        });
      }

      setSuccess("Last 6 months were created as insured.");
      await loadRecords();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Could not create last 6 months. Some records may already exist."
        )
      );
    }
  }

  function getPatientName(patientId) {
    const patient = patients.find(
      (item) => String(item.id) === String(patientId)
    );

    if (!patient) return `Patient #${patientId}`;

    return `${patient.fullName} (${patient.egn})`;
  }

  if (!canReadAll) {
    return (
      <div>
        <h2>Health Insurance</h2>
        <div className="card">
          <p>
            Patient-specific health insurance view can be added after creating a
            “my patient profile” endpoint.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Health Insurance Records</h2>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      

      {canWrite && (
        <form className="card form-grid" onSubmit={handleSubmit}>
          <h3>
            {editingId
              ? "Edit health insurance record"
              : "Create health insurance record"}
          </h3>

          <EntitySearchSelect
            label="Patient"
            value={form.patientId}
            onChange={(patientId) =>
              setForm((prev) => ({
                ...prev,
                patientId,
              }))
            }
            items={patients}
            getOptionLabel={(patient) =>
              `#${patient.id} — ${patient.fullName} — ${patient.egn}`
            }
            getSearchText={(patient) =>
              `${patient.id} ${patient.fullName} ${patient.egn}`
            }
            placeholder="Search patient by name, EGN or ID"
            emptyLabel="Select patient"
          />

          <label>
            Month
            <input
              name="month"
              type="month"
              value={form.month}
              onChange={handleChange}
            />
          </label>

          <label className="checkbox-row">
            <input
              name="insured"
              type="checkbox"
              checked={form.insured}
              onChange={handleChange}
            />
            Insured
          </label>

          <div>
            <button className="button" type="submit">
              {editingId ? "Update" : "Create"}
            </button>

            {!editingId && (
              <button
                className="button secondary"
                type="button"
                onClick={createLastSixMonthsInsured}
                style={{ marginLeft: 8 }}
              >
                Create last 6 months as insured
              </button>
            )}

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

      <div className="card form-grid">
        <h3>Filter records</h3>

        <EntitySearchSelect
          label="Filter by patient"
          value={filterPatientId}
          onChange={setFilterPatientId}
          items={patients}
          getOptionLabel={(patient) =>
            `#${patient.id} — ${patient.fullName} — ${patient.egn}`
          }
          getSearchText={(patient) =>
            `${patient.id} ${patient.fullName} ${patient.egn}`
          }
          placeholder="Search patient by name, EGN or ID"
          emptyLabel="All patients"
        />

        <div>
          <button
            className="button secondary"
            type="button"
            onClick={() => setFilterPatientId("")}
          >
            Clear filter
          </button>
        </div>
      </div>

      <div className="card">
        <h3>All health insurance records</h3>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Month</th>
              <th>Insured</th>
              {canWrite && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{getPatientName(record.patientId)}</td>
                <td>{record.month}</td>
                <td>{record.insured ? "Yes" : "No"}</td>

                {canWrite && (
                  <td>
                    <button
                      className="button secondary"
                      onClick={() => startEdit(record)}
                    >
                      Edit
                    </button>

                    <button
                      className="button secondary"
                      onClick={() => handleDelete(record.id)}
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

        {filteredRecords.length === 0 && (
          <p className="muted">No health insurance records found.</p>
        )}
      </div>
    </div>
  );
}