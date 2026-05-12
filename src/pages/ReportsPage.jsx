import { useEffect, useState } from "react";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthContext";
import { EntitySearchSelect } from "../components/EntitySearchSelect";
import { getErrorMessage } from "../utils/error";

function ReportTable({ columns, rows, emptyMessage = "No results." }) {
  return (
    <>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? `${row.doctorId ?? ""}-${row.patientId ?? ""}-${index}`}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row, index) : row[column.key] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {rows.length === 0 && <p className="muted">{emptyMessage}</p>}
    </>
  );
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return `${Number(value).toFixed(2)} BGN`;
}

function formatMonth(item) {
  if (!item) return "-";

  const month = String(item.month).padStart(2, "0");
  return `${item.year}-${month}`;
}

export function ReportsPage() {
  const { hasRole } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);

  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState("");
  const [selectedGpId, setSelectedGpId] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");

  const [examinationFilters, setExaminationFilters] = useState({
    doctorId: "",
    startDate: "",
    endDate: "",
  });

  const [patientsByDiagnosis, setPatientsByDiagnosis] = useState([]);
  const [mostCommonDiagnosis, setMostCommonDiagnosis] = useState(null);
  const [patientsByGp, setPatientsByGp] = useState([]);

  const [totalPaidByPatients, setTotalPaidByPatients] = useState(null);
  const [doctorRevenue, setDoctorRevenue] = useState([]);

  const [gpPatientCounts, setGpPatientCounts] = useState([]);
  const [doctorVisitCounts, setDoctorVisitCounts] = useState([]);

  const [patientVisitHistory, setPatientVisitHistory] = useState([]);
  const [filteredExaminations, setFilteredExaminations] = useState([]);

  const [monthWithMostSickLeaves, setMonthWithMostSickLeaves] = useState(null);
  const [doctorsWithMostSickLeaves, setDoctorsWithMostSickLeaves] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canViewReports = hasRole("ADMIN", "DOCTOR");
  const canViewFinancialReports = hasRole("ADMIN");

  const generalPractitioners = doctors.filter((doctor) => doctor.generalPractitioner);

  useEffect(() => {
    if (!canViewReports) return;

    async function loadReferenceData() {
      try {
        const [doctorsResponse, patientsResponse, diagnosesResponse] =
          await Promise.all([
            http.get("/doctors"),
            http.get("/patients"),
            http.get("/diagnoses"),
          ]);

        setDoctors(doctorsResponse.data);
        setPatients(patientsResponse.data);
        setDiagnoses(diagnosesResponse.data);
      } catch (err) {
        setError(getErrorMessage(err, "Could not load report reference data."));
      }
    }

    loadReferenceData();
  }, []);

  async function runReport(callback) {
    setLoading(true);
    setError("");

    try {
      await callback();
    } catch (err) {
      setError(getErrorMessage(err, "Could not load report."));
    } finally {
      setLoading(false);
    }
  }

  async function loadPatientsByDiagnosis() {
    if (!selectedDiagnosisId) {
      setError("Please select a diagnosis.");
      return;
    }

    await runReport(async () => {
      const response = await http.get(
        `/reports/patients/by-diagnosis/${selectedDiagnosisId}`
      );
      setPatientsByDiagnosis(response.data);
    });
  }

  async function loadMostCommonDiagnosis() {
    await runReport(async () => {
      const response = await http.get("/reports/diagnoses/most-common");
      setMostCommonDiagnosis(response.data);
    });
  }

  async function loadPatientsByGp() {
    if (!selectedGpId) {
      setError("Please select a general practitioner.");
      return;
    }

    await runReport(async () => {
      const response = await http.get(
        `/reports/patients/by-general-practitioner/${selectedGpId}`
      );
      setPatientsByGp(response.data);
    });
  }

  async function loadTotalPaidByPatients() {
    await runReport(async () => {
      const response = await http.get("/reports/payments/patient-total");
      setTotalPaidByPatients(response.data);
    });
  }

  async function loadDoctorRevenue() {
    await runReport(async () => {
      const response = await http.get("/reports/payments/patient-total/by-doctor");
      setDoctorRevenue(response.data);
    });
  }

  async function loadGpPatientCounts() {
    await runReport(async () => {
      const response = await http.get("/reports/general-practitioners/patient-count");
      setGpPatientCounts(response.data);
    });
  }

  async function loadDoctorVisitCounts() {
    await runReport(async () => {
      const response = await http.get("/reports/doctors/visit-count");
      setDoctorVisitCounts(response.data);
    });
  }

  async function loadPatientVisitHistory() {
    if (!selectedPatientId) {
      setError("Please select a patient.");
      return;
    }

    await runReport(async () => {
      const response = await http.get(
        `/reports/patients/${selectedPatientId}/visit-history`
      );
      setPatientVisitHistory(response.data);
    });
  }

  async function loadFilteredExaminations() {
    await runReport(async () => {
      const params = new URLSearchParams();

      if (examinationFilters.doctorId) {
        params.append("doctorId", examinationFilters.doctorId);
      }

      if (examinationFilters.startDate) {
        params.append("startDate", examinationFilters.startDate);
      }

      if (examinationFilters.endDate) {
        params.append("endDate", examinationFilters.endDate);
      }

      const query = params.toString();
      const url = query ? `/reports/examinations?${query}` : "/reports/examinations";

      const response = await http.get(url);
      setFilteredExaminations(response.data);
    });
  }

  async function loadMonthWithMostSickLeaves() {
    await runReport(async () => {
      const response = await http.get("/reports/sick-leaves/month-with-most");
      setMonthWithMostSickLeaves(response.data);
    });
  }

  async function loadDoctorsWithMostSickLeaves() {
    await runReport(async () => {
      const response = await http.get("/reports/sick-leaves/doctors-with-most");
      setDoctorsWithMostSickLeaves(response.data);
    });
  }

  async function loadAllSummaryReports() {
    await runReport(async () => {
      const requests = [
        http.get("/reports/diagnoses/most-common"),
        http.get("/reports/general-practitioners/patient-count"),
        http.get("/reports/doctors/visit-count"),
        http.get("/reports/sick-leaves/month-with-most"),
        http.get("/reports/sick-leaves/doctors-with-most"),
      ];

      const [
        mostCommonResponse,
        gpCountsResponse,
        visitCountsResponse,
        monthSickLeavesResponse,
        doctorsSickLeavesResponse,
      ] = await Promise.all(requests);

      setMostCommonDiagnosis(mostCommonResponse.data);
      setGpPatientCounts(gpCountsResponse.data);
      setDoctorVisitCounts(visitCountsResponse.data);
      setMonthWithMostSickLeaves(monthSickLeavesResponse.data);
      setDoctorsWithMostSickLeaves(doctorsSickLeavesResponse.data);

      if (canViewFinancialReports) {
        const [totalPaidResponse, doctorRevenueResponse] = await Promise.all([
          http.get("/reports/payments/patient-total"),
          http.get("/reports/payments/patient-total/by-doctor"),
        ]);

        setTotalPaidByPatients(totalPaidResponse.data);
        setDoctorRevenue(doctorRevenueResponse.data);
      }
    });
  }

  function handleExaminationFilterChange(event) {
    const { name, value } = event.target;

    setExaminationFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  if (!canViewReports) {
    return (
      <div>
        <h2>Reports</h2>
        <div className="card">
          <p>You do not have access to reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Reports</h2>
          <p className="muted">
            Medical statistics and administrative reports.
          </p>
        </div>

        <button
          className="button"
          type="button"
          onClick={loadAllSummaryReports}
          disabled={loading}
        >
          Load summary reports
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}
      {loading && <div className="alert info">Loading report...</div>}

      <div className="grid">
        <div className="card">
          <h3>Most common diagnosis</h3>

          <button
            className="button secondary"
            type="button"
            onClick={loadMostCommonDiagnosis}
            disabled={loading}
          >
            Load
          </button>

          {mostCommonDiagnosis ? (
            <div className="report-result">
              <strong>{mostCommonDiagnosis.diagnosisName}</strong>
              <span>{mostCommonDiagnosis.count} examinations</span>
            </div>
          ) : (
            <p className="muted">No data loaded.</p>
          )}
        </div>

        <div className="card">
          <h3>Month with most sick leaves</h3>

          <button
            className="button secondary"
            type="button"
            onClick={loadMonthWithMostSickLeaves}
            disabled={loading}
          >
            Load
          </button>

          {monthWithMostSickLeaves ? (
            <div className="report-result">
              <strong>{formatMonth(monthWithMostSickLeaves)}</strong>
              <span>{monthWithMostSickLeaves.sickLeaveCount} sick leaves</span>
            </div>
          ) : (
            <p className="muted">No data loaded.</p>
          )}
        </div>

        {canViewFinancialReports && (
          <div className="card">
            <h3>Total paid by patients</h3>

            <button
              className="button secondary"
              type="button"
              onClick={loadTotalPaidByPatients}
              disabled={loading}
            >
              Load
            </button>

            {totalPaidByPatients !== null ? (
              <div className="report-result">
                <strong>{formatMoney(totalPaidByPatients)}</strong>
              </div>
            ) : (
              <p className="muted">No data loaded.</p>
            )}
          </div>
        )}
      </div>

      <div className="card form-grid">
        <h3>Patients with selected diagnosis</h3>

        <EntitySearchSelect
          label="Diagnosis"
          value={selectedDiagnosisId}
          onChange={setSelectedDiagnosisId}
          items={diagnoses}
          getOptionLabel={(diagnosis) =>
            `#${diagnosis.id} — ${diagnosis.code ?? "-"} — ${diagnosis.name}`
          }
          getSearchText={(diagnosis) =>
            `${diagnosis.id} ${diagnosis.code ?? ""} ${diagnosis.name}`
          }
          placeholder="Search diagnosis by ID, code or name"
          emptyLabel="Select diagnosis"
        />

        <div>
          <button
            className="button"
            type="button"
            onClick={loadPatientsByDiagnosis}
            disabled={loading}
          >
            Load report
          </button>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <ReportTable
            columns={[
              { key: "id", label: "Patient ID" },
              { key: "fullName", label: "Full name" },
              { key: "egn", label: "EGN" },
            ]}
            rows={patientsByDiagnosis}
          />
        </div>
      </div>

      <div className="card form-grid">
        <h3>Patients by general practitioner</h3>

        <EntitySearchSelect
          label="General practitioner"
          value={selectedGpId}
          onChange={setSelectedGpId}
          items={generalPractitioners}
          getOptionLabel={(doctor) =>
            `#${doctor.id} — ${doctor.fullName} — ${doctor.specialty}`
          }
          getSearchText={(doctor) =>
            `${doctor.id} ${doctor.fullName} ${doctor.specialty}`
          }
          placeholder="Search GP by ID, name or specialty"
          emptyLabel="Select general practitioner"
        />

        <div>
          <button
            className="button"
            type="button"
            onClick={loadPatientsByGp}
            disabled={loading}
          >
            Load report
          </button>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <ReportTable
            columns={[
              { key: "id", label: "Patient ID" },
              { key: "fullName", label: "Full name" },
              { key: "egn", label: "EGN" },
              {
                key: "generalPractitioner",
                label: "General practitioner",
                render: (row) => row.generalPractitioner?.fullName ?? "-",
              },
            ]}
            rows={patientsByGp}
          />
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <h3>Patient count by general practitioner</h3>

          <button
            className="button secondary"
            type="button"
            onClick={loadGpPatientCounts}
            disabled={loading}
          >
            Load
          </button>
        </div>

        <ReportTable
          columns={[
            { key: "doctorId", label: "Doctor ID" },
            { key: "doctorName", label: "Doctor" },
            { key: "patientCount", label: "Patients" },
          ]}
          rows={gpPatientCounts}
        />
      </div>

      <div className="card">
        <div className="section-header">
          <h3>Visit count by doctor</h3>

          <button
            className="button secondary"
            type="button"
            onClick={loadDoctorVisitCounts}
            disabled={loading}
          >
            Load
          </button>
        </div>

        <ReportTable
          columns={[
            { key: "doctorId", label: "Doctor ID" },
            { key: "doctorName", label: "Doctor" },
            { key: "visitCount", label: "Visits" },
          ]}
          rows={doctorVisitCounts}
        />
      </div>

      {canViewFinancialReports && (
        <div className="card">
          <div className="section-header">
            <h3>Patient-paid examinations by doctor</h3>

            <button
              className="button secondary"
              type="button"
              onClick={loadDoctorRevenue}
              disabled={loading}
            >
              Load
            </button>
          </div>

          <ReportTable
            columns={[
              { key: "doctorId", label: "Doctor ID" },
              { key: "doctorName", label: "Doctor" },
              {
                key: "totalPaidByPatients",
                label: "Total paid by patients",
                render: (row) => formatMoney(row.totalPaidByPatients),
              },
            ]}
            rows={doctorRevenue}
          />
        </div>
      )}

      <div className="card form-grid">
        <h3>Patient visit history</h3>

        <EntitySearchSelect
          label="Patient"
          value={selectedPatientId}
          onChange={setSelectedPatientId}
          items={patients}
          getOptionLabel={(patient) =>
            `#${patient.id} — ${patient.fullName} — ${patient.egn}`
          }
          getSearchText={(patient) =>
            `${patient.id} ${patient.fullName} ${patient.egn}`
          }
          placeholder="Search patient by ID, name or EGN"
          emptyLabel="Select patient"
        />

        <div>
          <button
            className="button"
            type="button"
            onClick={loadPatientVisitHistory}
            disabled={loading}
          >
            Load report
          </button>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <ReportTable
            columns={[
              { key: "id", label: "ID" },
              { key: "examinationDate", label: "Date" },
              {
                key: "doctor",
                label: "Doctor",
                render: (row) => row.doctor?.fullName ?? "-",
              },
              {
                key: "diagnosis",
                label: "Diagnosis",
                render: (row) => row.diagnosis?.name ?? "-",
              },
              {
                key: "price",
                label: "Price",
                render: (row) => formatMoney(row.price),
              },
              { key: "paymentType", label: "Paid by" },
            ]}
            rows={patientVisitHistory}
          />
        </div>
      </div>

      <div className="card form-grid">
        <h3>Examinations by doctor and/or period</h3>

        <EntitySearchSelect
          label="Doctor"
          value={examinationFilters.doctorId}
          onChange={(doctorId) =>
            setExaminationFilters((prev) => ({
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
          placeholder="Search doctor by ID, name or specialty"
          emptyLabel="All doctors"
        />

        <label>
          Start date
          <input
            name="startDate"
            type="date"
            value={examinationFilters.startDate}
            onChange={handleExaminationFilterChange}
          />
        </label>

        <label>
          End date
          <input
            name="endDate"
            type="date"
            value={examinationFilters.endDate}
            onChange={handleExaminationFilterChange}
          />
        </label>

        <div>
          <button
            className="button"
            type="button"
            onClick={loadFilteredExaminations}
            disabled={loading}
          >
            Load report
          </button>

          <button
            className="button secondary"
            type="button"
            onClick={() =>
              setExaminationFilters({
                doctorId: "",
                startDate: "",
                endDate: "",
              })
            }
            style={{ marginLeft: 8 }}
          >
            Clear
          </button>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <ReportTable
            columns={[
              { key: "id", label: "ID" },
              { key: "examinationDate", label: "Date" },
              {
                key: "doctor",
                label: "Doctor",
                render: (row) => row.doctor?.fullName ?? "-",
              },
              {
                key: "patient",
                label: "Patient",
                render: (row) => row.patient?.fullName ?? "-",
              },
              {
                key: "diagnosis",
                label: "Diagnosis",
                render: (row) => row.diagnosis?.name ?? "-",
              },
              {
                key: "price",
                label: "Price",
                render: (row) => formatMoney(row.price),
              },
              { key: "paymentType", label: "Paid by" },
            ]}
            rows={filteredExaminations}
          />
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <h3>Doctors with most sick leaves</h3>

          <button
            className="button secondary"
            type="button"
            onClick={loadDoctorsWithMostSickLeaves}
            disabled={loading}
          >
            Load
          </button>
        </div>

        <ReportTable
          columns={[
            { key: "doctorId", label: "Doctor ID" },
            { key: "doctorName", label: "Doctor" },
            { key: "sickLeaveCount", label: "Sick leaves" },
          ]}
          rows={doctorsWithMostSickLeaves}
        />
      </div>
    </div>
  );
}