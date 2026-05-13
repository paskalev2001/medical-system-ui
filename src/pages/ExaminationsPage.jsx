import { useEffect, useState } from "react";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthContext";
import { EntitySearchSelect } from "../components/EntitySearchSelect";
import { getErrorMessage } from "../utils/error";

const emptyForm = {
  examinationDate: "",
  doctorId: "",
  patientId: "",
  diagnosisId: "",
  prescribedTreatment: "",
  price: "",
};

export function ExaminationsPage() {
  const { currentUser, hasRole } = useAuth();

  const [examinations, setExaminations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const canReadAll = hasRole("ADMIN", "DOCTOR");
  const canWrite = hasRole("ADMIN", "DOCTOR");

  async function loadExaminations() {
    const url = canReadAll ? "/examinations" : "/examinations/me";
    const response = await http.get(url);
    setExaminations(response.data);
  }

  async function loadDropdownData() {
    const [doctorsResponse, patientsResponse, diagnosesResponse] =
      await Promise.all([
        http.get("/doctors"),
        http.get("/patients"),
        http.get("/diagnoses"),
      ]);

    setDoctors(doctorsResponse.data);
    setPatients(patientsResponse.data);
    setDiagnoses(diagnosesResponse.data);

    if (currentUser?.role === "DOCTOR") {
      const ownDoctorProfile = doctorsResponse.data.find(
        (doctor) => doctor.userId === currentUser.id
      );

      if (ownDoctorProfile) {
        setForm((prev) => ({
          ...prev,
          doctorId: ownDoctorProfile.id,
        }));
      }
    }
  }

  useEffect(() => {
    if (canReadAll) {
      Promise.all([loadExaminations(), loadDropdownData()]).catch((err) =>
        setError(getErrorMessage(err, "Could not load examinations."))
      );
    } else {
      loadExaminations().catch((err) =>
        setError(getErrorMessage(err, "Could not load examinations."))
      );
    }
  }, []);

  function startCreate() {
    setEditingId(null);

    const ownDoctor = doctors.find((doctor) => doctor.userId === currentUser?.id);

    setForm({
      ...emptyForm,
      doctorId: currentUser?.role === "DOCTOR" && ownDoctor ? ownDoctor.id : "",
    });

    setError("");
  }

  function startEdit(examination) {
    setEditingId(examination.id);

    setForm({
      examinationDate: examination.examinationDate,
      doctorId: examination.doctor?.id ?? "",
      patientId: examination.patient?.id ?? "",
      diagnosisId: examination.diagnosis?.id ?? "",
      prescribedTreatment: examination.prescribedTreatment,
      price: examination.price,
    });

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const payload = {
      examinationDate: form.examinationDate,
      doctorId: Number(form.doctorId),
      patientId: Number(form.patientId),
      diagnosisId: Number(form.diagnosisId),
      prescribedTreatment: form.prescribedTreatment,
      price: Number(form.price),
    };

    try {
      if (editingId) {
        await http.put(`/examinations/${editingId}`, payload);
      } else {
        await http.post("/examinations", payload);
      }

      startCreate();
      await loadExaminations();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save examination."));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this examination?")) return;

    try {
      await http.delete(`/examinations/${id}`);
      await loadExaminations();
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete examination."));
    }
  }

  if (!canReadAll) {
    return (
      <div>
        <h2>My Examinations</h2>

        {error && <div className="alert error">{error}</div>}

        <div className="card">
          <h3>My examination history</h3>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Doctor</th>
                <th>Diagnosis</th>
                <th>Price</th>
                <th>Paid by</th>
                <th>Treatment</th>
              </tr>
            </thead>

            <tbody>
              {examinations.map((examination) => (
                <tr key={examination.id}>
                  <td>{examination.id}</td>
                  <td>{examination.examinationDate}</td>
                  <td>{examination.doctor?.fullName ?? "-"}</td>
                  <td>{examination.diagnosis?.name ?? "-"}</td>
                  <td>{examination.price}</td>
                  <td>{examination.paymentType}</td>
                  <td>{examination.prescribedTreatment}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {examinations.length === 0 && (
            <p className="muted">No examinations found.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Examinations</h2>

      {error && <div className="alert error">{error}</div>}

      {canWrite && (
        <form className="card form-grid" onSubmit={handleSubmit}>
          <h3>{editingId ? "Edit examination" : "Create examination"}</h3>

          <label>
            Examination date
            <input
              name="examinationDate"
              type="date"
              value={form.examinationDate}
              onChange={handleChange}
            />
          </label>

          <EntitySearchSelect
            label="Doctor"
            value={form.doctorId}
            onChange={(doctorId) =>
              setForm((prev) => ({
                ...prev,
                doctorId,
              }))
            }
            items={doctors}
            getOptionLabel={(doctor) =>
              `#${doctor.id} — ${doctor.fullName} — ${doctor.specialty}`
            }
            getSearchText={(doctor) =>
              `${doctor.id} ${doctor.fullName} ${doctor.specialty}`
            }
            placeholder="Search doctor by name, ID or specialty"
            emptyLabel="Select doctor"
          />

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

          <EntitySearchSelect
            label="Diagnosis"
            value={form.diagnosisId}
            onChange={(diagnosisId) =>
              setForm((prev) => ({
                ...prev,
                diagnosisId,
              }))
            }
            items={diagnoses}
            getOptionLabel={(diagnosis) =>
              `#${diagnosis.id} — ${diagnosis.code ?? "-"} — ${diagnosis.name}`
            }
            getSearchText={(diagnosis) =>
              `${diagnosis.id} ${diagnosis.code ?? ""} ${diagnosis.name}`
            }
            placeholder="Search diagnosis by name, code or ID"
            emptyLabel="Select diagnosis"
          />

          <label>
            Price
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={handleChange}
              placeholder="80.00"
            />
          </label>

          <label style={{ gridColumn: "1 / -1" }}>
            Prescribed treatment
            <input
              name="prescribedTreatment"
              value={form.prescribedTreatment}
              onChange={handleChange}
              placeholder="Treatment details"
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
        <h3>All examinations</h3>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Doctor</th>
              <th>Patient</th>
              <th>Diagnosis</th>
              <th>Price</th>
              <th>Paid by</th>
              <th>Treatment</th>
              {canWrite && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {examinations.map((examination) => (
              <tr key={examination.id}>
                <td>{examination.id}</td>
                <td>{examination.examinationDate}</td>
                <td>{examination.doctor?.fullName ?? "-"}</td>
                <td>{examination.patient?.fullName ?? "-"}</td>
                <td>{examination.diagnosis?.name ?? "-"}</td>
                <td>{examination.price}</td>
                <td>{examination.paymentType}</td>
                <td>{examination.prescribedTreatment}</td>

                {canWrite && (
                  <td>
                    <button
                      className="button secondary"
                      onClick={() => startEdit(examination)}
                    >
                      Edit
                    </button>

                    <button
                      className="button secondary"
                      onClick={() => handleDelete(examination.id)}
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

        {examinations.length === 0 && (
          <p className="muted">No examinations found.</p>
        )}
      </div>
    </div>
  );
}