import { useEffect, useState } from "react";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthContext";
import { EntitySearchSelect } from "../components/EntitySearchSelect";
import { getErrorMessage } from "../utils/error";

const emptyForm = {
  examinationId: "",
  startDate: "",
  numberOfDays: 1,
};

export function SickLeavesPage() {
  const { hasRole } = useAuth();

  const [sickLeaves, setSickLeaves] = useState([]);
  const [examinations, setExaminations] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const canReadAll = hasRole("ADMIN", "DOCTOR");
  const canWrite = hasRole("ADMIN", "DOCTOR");

  async function loadSickLeaves() {
    const url = canReadAll ? "/sick-leaves" : "/sick-leaves/me";
    const response = await http.get(url);
    setSickLeaves(response.data);
  }

  async function loadExaminations() {
    const response = await http.get("/examinations");
    setExaminations(response.data);
  }

  useEffect(() => {
    if (canReadAll) {
      Promise.all([loadSickLeaves(), loadExaminations()]).catch((err) =>
        setError(getErrorMessage(err, "Could not load sick leaves."))
      );
    } else {
      loadSickLeaves().catch((err) =>
        setError(getErrorMessage(err, "Could not load sick leaves."))
      );
    }
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

  function startEdit(sickLeave) {
    setEditingId(sickLeave.id);

    setForm({
      examinationId: sickLeave.examinationId,
      startDate: sickLeave.startDate,
      numberOfDays: sickLeave.numberOfDays,
    });

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const payload = {
      examinationId: Number(form.examinationId),
      startDate: form.startDate,
      numberOfDays: Number(form.numberOfDays),
    };

    try {
      if (editingId) {
        await http.put(`/sick-leaves/${editingId}`, payload);
      } else {
        await http.post("/sick-leaves", payload);
      }

      startCreate();
      await loadSickLeaves();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save sick leave."));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this sick leave?")) return;

    try {
      await http.delete(`/sick-leaves/${id}`);
      await loadSickLeaves();
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete sick leave."));
    }
  }

  function getExaminationLabel(examination) {
    return `#${examination.id} — ${examination.examinationDate} — ${
      examination.patient?.fullName ?? "-"
    } — ${examination.doctor?.fullName ?? "-"} — ${
      examination.diagnosis?.name ?? "-"
    }`;
  }

  function getExaminationSearchText(examination) {
    return `${examination.id} ${examination.examinationDate} ${
      examination.patient?.fullName ?? ""
    } ${examination.patient?.egn ?? ""} ${
      examination.doctor?.fullName ?? ""
    } ${examination.diagnosis?.name ?? ""}`;
  }

  function findExamination(examinationId) {
    return examinations.find(
      (examination) => String(examination.id) === String(examinationId)
    );
  }

  if (!canReadAll) {
    return (
      <div>
        <h2>My Sick Leaves</h2>

        {error && <div className="alert error">{error}</div>}

        <div className="card">
          <h3>My sick leaves</h3>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Examination</th>
                <th>Start date</th>
                <th>Days</th>
              </tr>
            </thead>

            <tbody>
              {sickLeaves.map((sickLeave) => (
                <tr key={sickLeave.id}>
                  <td>{sickLeave.id}</td>
                  <td>#{sickLeave.examinationId}</td>
                  <td>{sickLeave.startDate}</td>
                  <td>{sickLeave.numberOfDays}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {sickLeaves.length === 0 && (
            <p className="muted">No sick leaves found.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Sick Leaves</h2>

      {error && <div className="alert error">{error}</div>}

      {canWrite && (
        <form className="card form-grid" onSubmit={handleSubmit}>
          <h3>{editingId ? "Edit sick leave" : "Create sick leave"}</h3>

          <EntitySearchSelect
            label="Examination"
            value={form.examinationId}
            onChange={(examinationId) =>
              setForm((prev) => ({
                ...prev,
                examinationId,
              }))
            }
            items={examinations}
            getOptionLabel={getExaminationLabel}
            getSearchText={getExaminationSearchText}
            placeholder="Search by patient, doctor, diagnosis, date or ID"
            emptyLabel="Select examination"
          />

          <label>
            Start date
            <input
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
            />
          </label>

          <label>
            Number of days
            <input
              name="numberOfDays"
              type="number"
              min="1"
              value={form.numberOfDays}
              onChange={handleChange}
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
        <h3>All sick leaves</h3>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Examination</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Start date</th>
              <th>Days</th>
              {canWrite && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {sickLeaves.map((sickLeave) => {
              const examination = findExamination(sickLeave.examinationId);

              return (
                <tr key={sickLeave.id}>
                  <td>{sickLeave.id}</td>
                  <td>#{sickLeave.examinationId}</td>
                  <td>{examination?.patient?.fullName ?? "-"}</td>
                  <td>{examination?.doctor?.fullName ?? "-"}</td>
                  <td>{sickLeave.startDate}</td>
                  <td>{sickLeave.numberOfDays}</td>

                  {canWrite && (
                    <td>
                      <button
                        className="button secondary"
                        onClick={() => startEdit(sickLeave)}
                      >
                        Edit
                      </button>

                      <button
                        className="button secondary"
                        onClick={() => handleDelete(sickLeave.id)}
                        style={{ marginLeft: 8 }}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {sickLeaves.length === 0 && (
          <p className="muted">No sick leaves found.</p>
        )}
      </div>
    </div>
  );
}