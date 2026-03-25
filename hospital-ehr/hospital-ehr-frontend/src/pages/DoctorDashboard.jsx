import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Notifications from "../components/Notifications";

function DoctorDashboard() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [reportFiles, setReportFiles] = useState([]);
  const [uploadKey, setUploadKey] = useState(0);
  const [form, setForm] = useState({
    patientId: "",
    diagnosis: "",
    prescription: "",
    testResults: "",
  });

  const recordsWithPredictions = records.filter((record) => Boolean(record.aiPrediction));
  const highRiskRecords = records.filter((record) => {
    const info = record.aiPredictions || {};
    const predictionText = [
      info.heartRisk,
      info.diabetes,
      info.ecgResult,
      record.aiPrediction,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      predictionText.includes("high risk") ||
      predictionText.includes("abnormal") ||
      Number(info.confidence || 0) >= 0.7
    );
  });

  const highRiskPatients = Array.from(
    new Map(
      highRiskRecords.map((record) => [
        record.patient?._id,
        {
          id: record.patient?._id,
          name: record.patient?.name || record.patient?.email || "Patient",
          patientId: record.patient?.patientId || "N/A",
          summary:
            record.aiPredictions?.ecgResult ||
            record.aiPredictions?.heartRisk ||
            record.aiPredictions?.diabetes ||
            record.aiPrediction ||
            "High-risk signal",
        },
      ])
    ).values()
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [patientsRes, recordsRes] = await Promise.all([
        api.get("/doctors/patients"),
        api.get("/records/my"),
      ]);
      const patientData = patientsRes.data?.data?.patients || [];
      setPatients(patientData);
      setFilteredPatients(patientData);
      setRecords(recordsRes.data?.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Search filter
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPatients(patients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = patients.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query) ||
          p._id?.toLowerCase().includes(query) ||
          p.patientId?.toLowerCase().includes(query)
      );
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          style={{
            background: isDarkMode ? "#fbbf24" : "#fef3c7",
            color: isDarkMode ? "#1e293b" : "#92400e",
            padding: "2px 4px",
            borderRadius: "3px",
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const payload = new FormData();
      payload.append("patientId", form.patientId);
      payload.append("diagnosis", form.diagnosis);
      payload.append("prescription", form.prescription || "");
      payload.append("testResults", form.testResults || "");

      reportFiles.forEach((file) => {
        payload.append("reports", file);
      });

      await api.post("/records", payload);

      setForm({ patientId: "", diagnosis: "", prescription: "", testResults: "" });
      setReportFiles([]);
      setUploadKey((value) => value + 1);
      setSuccess("Medical record created successfully with scan processing.");
      await loadData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create record");
    }
  };
  const theme = isDarkMode
    ? {
        bg: "#0f172a",
        cardBg: "#1e293b",
        sidebarBg: "linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)",
        text: "#f1f5f9",
        textSecondary: "#94a3b8",
        border: "#334155",
        statBg: "#334155",
      }
    : {
        bg: "#F8FAFC",
        cardBg: "white",
        sidebarBg: "linear-gradient(180deg, #2563EB 0%, #1e40af 100%)",
        text: "#1e293b",
        textSecondary: "#64748b",
        border: "#E2E8F0",
        statBg: "#F8FAFC",
      };

  return (
    <div style={{ ...styles.container, background: theme.bg }}>
      {/* Sidebar */}
      <div style={{ ...styles.sidebar, background: theme.sidebarBg }}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🏥</div>
          <h2 style={styles.logoText}>Doctor Portal</h2>
        </div>

        <nav style={styles.nav}>
          <button
            style={{
              ...styles.navItem,
              ...(activeSection === "dashboard" ? styles.navItemActive : {}),
            }}
            onClick={() => setActiveSection("dashboard")}
          >
            <span style={styles.navIcon}>📊</span>
            Dashboard
          </button>
          <button
            style={{
              ...styles.navItem,
              ...(activeSection === "patients" ? styles.navItemActive : {}),
            }}
            onClick={() => setActiveSection("patients")}
          >
            <span style={styles.navIcon}>👥</span>
            My Patients
          </button>
          <button
            style={{
              ...styles.navItem,
              ...(activeSection === "addRecord" ? styles.navItemActive : {}),
            }}
            onClick={() => setActiveSection("addRecord")}
          >
            <span style={styles.navIcon}>➕</span>
            Add Record
          </button>
          <button
            style={{
              ...styles.navItem,
              ...(activeSection === "records" ? styles.navItemActive : {}),
            }}
            onClick={() => setActiveSection("records")}
          >
            <span style={styles.navIcon}>📋</span>
            Medical Records
          </button>
          <button
            style={{
              ...styles.navItem,
              ...(activeSection === "predictions" ? styles.navItemActive : {}),
            }}
            onClick={() => setActiveSection("predictions")}
          >
            <span style={styles.navIcon}>🤖</span>
            AI Predictions
          </button>
          <button style={styles.navItem} onClick={() => navigate('/health-prediction')}>
            <span style={styles.navIcon}>🧠</span>
            Run Prediction
          </button>
        </nav>

        <button style={styles.logoutBtn} onClick={handleLogout}>
          <span style={styles.navIcon}>🚪</span>
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Top Bar */}
        <div style={{ ...styles.topBar, background: theme.cardBg, borderColor: theme.border }}>
          <div>
            <h1 style={{ ...styles.greeting, color: theme.text }}>Welcome, Dr. {user?.email?.split("@")[0]}</h1>
            <p style={{ ...styles.subtitle, color: theme.textSecondary }}>Manage your patients and medical records</p>
          </div>
          <div style={styles.topBarRight}>
            {/* Theme Toggle */}
            <button
              style={{
                ...styles.themeToggle,
                background: theme.statBg,
                color: theme.text,
              }}
              onClick={toggleTheme}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
            
            {/* Notifications */}
            <Notifications isDarkMode={isDarkMode} />
            
            {/* Profile */}
            <div style={{ ...styles.profileCard, background: theme.statBg }}>
              <div style={styles.avatar}>{user?.email?.[0]?.toUpperCase()}</div>
              <div>
                <p style={{ ...styles.profileName, color: theme.text }}>Dr. {user?.email?.split("@")[0]}</p>
                <p style={{ ...styles.profileRole, color: theme.textSecondary }}>Doctor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {activeSection === "dashboard" && (
            <>
              {/* Stats Grid */}
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statIcon}>👥</div>
                  <div>
                    <p style={styles.statValue}>{loading ? "..." : patients.length}</p>
                    <p style={styles.statLabel}>Total Patients</p>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, background: "#DBEAFE" }}>📋</div>
                  <div>
                    <p style={styles.statValue}>{loading ? "..." : records.length}</p>
                    <p style={styles.statLabel}>Medical Records</p>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, background: "#FEE2E2" }}>🤖</div>
                  <div>
                    <p style={styles.statValue}>{loading ? "..." : recordsWithPredictions.length}</p>
                    <p style={styles.statLabel}>AI Predictions</p>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statIcon, background: "#E0E7FF" }}>⏳</div>
                  <div>
                    <p style={styles.statValue}>0</p>
                    <p style={styles.statLabel}>Pending Reviews</p>
                  </div>
                </div>
              </div>

              {/* Recent Patients */}
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Recent Patients</h2>
                {loading ? (
                  <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <p>Loading patients...</p>
                  </div>
                ) : patients.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>👥</div>
                    <h3>No Patients Assigned</h3>
                    <p>Patients will appear here once assigned to you.</p>
                  </div>
                ) : (
                  <div style={styles.table}>
                    <div style={styles.tableHeader}>
                      <div style={styles.th}>Patient Name</div>
                      <div style={styles.th}>Email</div>
                      <div style={styles.th}>Patient ID</div>
                      <div style={styles.th}>Action</div>
                    </div>
                    {patients.slice(0, 5).map((p) => (
                      <div key={p._id} style={styles.tableRow}>
                        <div style={styles.td}>
                          <div style={styles.patientCell}>
                            <div style={styles.patientAvatar}>
                              {(p.name || p.email)?.[0]?.toUpperCase()}
                            </div>
                            <strong>{p.name || p.email}</strong>
                          </div>
                        </div>
                        <div style={styles.td}>{p.email}</div>
                        <div style={styles.td}>
                          <span style={styles.patientIdBadge}>
                            {p.patientId || p._id?.slice(-6) || "N/A"}
                          </span>
                        </div>
                        <div style={styles.td}>
                          <button
                            style={styles.viewBtn}
                            onClick={() => setActiveSection("addRecord")}
                          >
                            Add Record
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Records */}
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Recent Medical Records</h2>
                {records.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>📋</div>
                    <h3>No Records Created</h3>
                    <p>Start creating medical records for your patients.</p>
                  </div>
                ) : (
                  <div style={styles.recordsGrid}>
                    {records.slice(0, 4).map((r) => (
                      <div key={r._id} style={styles.recordCard}>
                        <div style={styles.recordHeader}>
                          <div style={styles.recordPatient}>
                            👤 {r.patient?.name || r.patient?.email || "Patient"}
                          </div>
                          <div style={styles.recordDate}>
                            {new Date(r.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={styles.recordBody}>
                          <div style={styles.recordField}>
                            <span style={styles.fieldLabel}>Diagnosis:</span>
                            <span style={styles.fieldValue}>{r.diagnosis || "-"}</span>
                          </div>
                          <div style={styles.recordField}>
                            <span style={styles.fieldLabel}>Prescription:</span>
                            <span style={styles.fieldValue}>{r.prescription || "-"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* High Risk Alerts */}
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>High-Risk Alerts</h2>
                {highRiskPatients.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>✅</div>
                    <h3>No High-Risk Alerts</h3>
                    <p>Patients with high-risk heart/diabetes or abnormal ECG predictions will appear here.</p>
                  </div>
                ) : (
                  <div style={styles.recordsGrid}>
                    {highRiskPatients.slice(0, 6).map((patient) => (
                      <div key={patient.id} style={styles.recordCard}>
                        <div style={styles.recordHeader}>
                          <div style={styles.recordPatient}>⚠️ {patient.name}</div>
                          <div style={styles.recordDate}>{patient.patientId}</div>
                        </div>
                        <div style={styles.recordBody}>
                          <div style={styles.recordField}>
                            <span style={styles.fieldLabel}>Alert:</span>
                            <span style={{ ...styles.fieldValue, color: '#b91c1c', fontWeight: 700 }}>{patient.summary}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeSection === "patients" && (
            <div style={styles.section}>
              <h2 style={{ ...styles.sectionTitle, color: theme.text }}>All Patients</h2>
              
              {/* Smart Search Bar */}
              <div style={{ ...styles.searchContainer, background: theme.cardBg, borderColor: theme.border }}>
                <input
                  type="text"
                  placeholder="🔍 Search by name / phone / ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    ...styles.searchInput,
                    background: theme.statBg,
                    color: theme.text,
                    borderColor: theme.border,
                  }}
                />
                {searchQuery && (
                  <button
                    style={styles.clearSearch}
                    onClick={() => setSearchQuery("")}
                  >
                    ✕
                  </button>
                )}
              </div>

              {loading ? (
                <div style={styles.loadingContainer}>
                  <div style={styles.spinner}></div>
                  <p style={{ color: theme.textSecondary }}>Loading patients...</p>
                </div>
              ) : filteredPatients.length === 0 && searchQuery ? (
                <div style={{ ...styles.emptyState, background: theme.cardBg, borderColor: theme.border }}>
                  <div style={styles.emptyIcon}>🔍</div>
                  <h3 style={{ color: theme.text }}>No Results Found</h3>
                  <p style={{ color: theme.textSecondary }}>No patients match "{searchQuery}"</p>
                </div>
              ) : patients.length === 0 ? (
                <div style={{ ...styles.emptyState, background: theme.cardBg, borderColor: theme.border }}>
                  <div style={styles.emptyIcon}>👥</div>
                  <h3 style={{ color: theme.text }}>No Patients Found</h3>
                  <p style={{ color: theme.textSecondary }}>Patients assigned to you will appear here.</p>
                </div>
              ) : (
                <div style={{ ...styles.table, background: theme.cardBg }}>
                  <div style={{ ...styles.tableHeader, background: theme.statBg, borderColor: theme.border }}>
                    <div style={{ ...styles.th, color: theme.textSecondary }}>Patient Name</div>
                    <div style={{ ...styles.th, color: theme.textSecondary }}>Email</div>
                    <div style={{ ...styles.th, color: theme.textSecondary }}>Patient ID</div>
                    <div style={{ ...styles.th, color: theme.textSecondary }}>Actions</div>
                  </div>
                  {filteredPatients.map((p) => (
                    <div key={p._id} style={{ ...styles.tableRow, borderColor: theme.border }}>
                      <div style={{ ...styles.td, color: theme.text }}>
                        <div style={styles.patientCell}>
                          <div style={styles.patientAvatar}>
                            {(p.name || p.email)?.[0]?.toUpperCase()}
                          </div>
                          <strong>{highlightMatch(p.name || p.email, searchQuery)}</strong>
                        </div>
                      </div>
                      <div style={{ ...styles.td, color: theme.textSecondary }}>
                        {highlightMatch(p.email, searchQuery)}
                      </div>
                      <div style={styles.td}>
                        <span style={{
                          ...styles.patientIdBadge,
                          background: isDarkMode ? '#1e40af' : '#dbeafe',
                          color: isDarkMode ? '#93c5fd' : '#1e40af',
                        }}>
                          {highlightMatch(p.patientId || p._id?.slice(-6) || "N/A", searchQuery)}
                        </span>
                      </div>
                      <div style={styles.td}>
                        <button style={{
                          ...styles.viewBtn,
                          background: isDarkMode ? '#1e40af' : '#2563EB',
                          color: '#fff',
                        }}>View Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === "addRecord" && (
            <div style={styles.section}>
              <h2 style={{ ...styles.sectionTitle, color: theme.text }}>Create Medical Record</h2>
              <div style={{ ...styles.formCard, background: theme.cardBg, borderColor: theme.border }}>
                {error && (
                  <div style={styles.errorAlert}>
                    <span style={styles.alertIcon}>⚠️</span>
                    {error}
                  </div>
                )}
                {success && (
                  <div style={styles.successAlert}>
                    <span style={styles.alertIcon}>✓</span>
                    {success}
                  </div>
                )}
                <form onSubmit={handleSubmit} style={styles.form}>
                  <div style={styles.formGroup}>
                    <label style={{ ...styles.label, color: theme.text }}>Select Patient</label>
                    <select
                      value={form.patientId}
                      onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                      required
                      style={{
                        ...styles.select,
                        background: theme.statBg,
                        color: theme.text,
                        borderColor: theme.border,
                      }}
                    >
                      <option value="">Choose a patient...</option>
                      {patients.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name || p.email} ({p.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={{ ...styles.label, color: theme.text }}>Diagnosis *</label>
                    <input
                      style={{
                        ...styles.input,
                        background: theme.statBg,
                        color: theme.text,
                        borderColor: theme.border,
                      }}
                      placeholder="Enter diagnosis"
                      value={form.diagnosis}
                      onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={{ ...styles.label, color: theme.text }}>Prescription</label>
                    <textarea
                      style={{
                        ...styles.input,
                        minHeight: "100px",
                        resize: "vertical",
                        background: theme.statBg,
                        color: theme.text,
                        borderColor: theme.border,
                      }}
                      placeholder="Enter prescription details"
                      value={form.prescription}
                      onChange={(e) => setForm({ ...form, prescription: e.target.value })}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={{ ...styles.label, color: theme.text }}>Test Results</label>
                    <textarea
                      style={{
                        ...styles.input,
                        minHeight: "100px",
                        resize: "vertical",
                        background: theme.statBg,
                        color: theme.text,
                        borderColor: theme.border,
                      }}
                      placeholder="Enter test results"
                      value={form.testResults}
                      onChange={(e) => setForm({ ...form, testResults: e.target.value })}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={{ ...styles.label, color: theme.text }}>Scan / Lab Reports (optional)</label>
                    <input
                      key={uploadKey}
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={(e) => setReportFiles(Array.from(e.target.files || []))}
                      style={{
                        ...styles.input,
                        padding: "12px",
                        background: theme.statBg,
                        color: theme.text,
                        borderColor: theme.border,
                      }}
                    />
                    <small style={{ color: theme.textSecondary }}>
                      Upload patient scan images or PDF reports for AI prediction.
                    </small>
                  </div>
                  <button style={{
                    ...styles.submitBtn,
                    background: isDarkMode ? '#1e40af' : '#2563EB',
                    color: '#fff',
                  }} type="submit">
                    Create Medical Record
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeSection === "records" && (
            <div style={styles.section}>
              <h2 style={{ ...styles.sectionTitle, color: theme.text }}>All Medical Records</h2>
              {loading ? (
                <div style={styles.loadingContainer}>
                  <div style={styles.spinner}></div>
                  <p style={{ color: theme.textSecondary }}>Loading records...</p>
                </div>
              ) : records.length === 0 ? (
                <div style={{ ...styles.emptyState, background: theme.cardBg, borderColor: theme.border }}>
                  <div style={styles.emptyIcon}>📋</div>
                  <h3 style={{ color: theme.text }}>No Records Found</h3>
                  <p style={{ color: theme.textSecondary }}>Create your first medical record to get started.</p>
                </div>
              ) : (
                <div style={styles.recordsGrid}>
                  {records.map((r) => (
                    <div key={r._id} style={{ ...styles.recordCard, background: theme.cardBg, borderColor: theme.border }}>
                      <div style={{ ...styles.recordHeader, borderColor: theme.border }}>
                        <div style={{ ...styles.recordPatient, color: theme.text }}>
                          👤 {r.patient?.name || r.patient?.email || "Patient"}
                        </div>
                        <div style={{
                          ...styles.recordDate,
                          background: theme.statBg,
                          color: theme.textSecondary,
                        }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={styles.recordBody}>
                        <div style={styles.recordField}>
                          <span style={{ ...styles.fieldLabel, color: theme.textSecondary }}>Diagnosis:</span>
                          <span style={{ ...styles.fieldValue, color: theme.text }}>{r.diagnosis || "-"}</span>
                        </div>
                        <div style={styles.recordField}>
                          <span style={{ ...styles.fieldLabel, color: theme.textSecondary }}>Prescription:</span>
                          <span style={{ ...styles.fieldValue, color: theme.text }}>{r.prescription || "-"}</span>
                        </div>
                        {r.testResults && (
                          <div style={styles.recordField}>
                            <span style={{ ...styles.fieldLabel, color: theme.textSecondary }}>Test Results:</span>
                            <span style={{ ...styles.fieldValue, color: theme.text }}>{r.testResults}</span>
                          </div>
                        )}
                        {r.aiPrediction && (
                          <div style={styles.recordField}>
                            <span style={{ ...styles.fieldLabel, color: theme.textSecondary }}>AI Prediction:</span>
                            <span style={{ ...styles.fieldValue, color: theme.text }}>{r.aiPrediction}</span>
                          </div>
                        )}
                        {Array.isArray(r.labReports) && r.labReports.length > 0 && (
                          <div style={styles.recordField}>
                            <span style={{ ...styles.fieldLabel, color: theme.textSecondary }}>Reports:</span>
                            <span style={{ ...styles.fieldValue, color: theme.text }}>{r.labReports.length} file(s)</span>
                          </div>
                        )}
                      </div>
                      <button style={{
                        ...styles.viewDetailsBtn,
                        background: isDarkMode ? 'linear-gradient(135deg, #1e40af, #1e3a8a)' : 'linear-gradient(135deg, #2563EB, #1d4ed8)',
                        color: 'white',
                      }}>View Full Record →</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === "predictions" && (
            <div style={styles.section}>
              <h2 style={{ ...styles.sectionTitle, color: theme.text }}>AI Predictions</h2>
              {highRiskPatients.length > 0 && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #ef4444',
                  background: isDarkMode ? 'rgba(239,68,68,0.2)' : '#fee2e2',
                  color: isDarkMode ? '#fecaca' : '#991b1b',
                  fontWeight: 600,
                }}>
                  {highRiskPatients.length} patient(s) currently flagged as high-risk.
                </div>
              )}
              {recordsWithPredictions.length === 0 ? (
                <div style={{ ...styles.emptyState, background: theme.cardBg, borderColor: theme.border }}>
                  <div style={styles.emptyIcon}>🤖</div>
                  <h3 style={{ color: theme.text }}>No AI Predictions Available</h3>
                  <p style={{ color: theme.textSecondary }}>
                    Upload scan files while creating a record to generate predictions.
                  </p>
                </div>
              ) : (
                <div style={styles.recordsGrid}>
                  {recordsWithPredictions.map((record) => (
                    <div
                      key={record._id}
                      style={{ ...styles.recordCard, background: theme.cardBg, borderColor: theme.border }}
                    >
                      <div style={{ ...styles.recordHeader, borderColor: theme.border }}>
                        <div style={{ ...styles.recordPatient, color: theme.text }}>
                          👤 {record.patient?.name || record.patient?.email || "Patient"}
                        </div>
                        <div
                          style={{
                            ...styles.recordDate,
                            background: theme.statBg,
                            color: theme.textSecondary,
                          }}
                        >
                          {new Date(record.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={styles.recordBody}>
                        <div style={styles.recordField}>
                          <span style={{ ...styles.fieldLabel, color: theme.textSecondary }}>Diagnosis:</span>
                          <span style={{ ...styles.fieldValue, color: theme.text }}>{record.diagnosis || "-"}</span>
                        </div>
                        <div style={styles.recordField}>
                          <span style={{ ...styles.fieldLabel, color: theme.textSecondary }}>AI Prediction:</span>
                          <span style={{ ...styles.fieldValue, color: theme.text }}>{record.aiPrediction}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    background: "#F8FAFC",
  },
  sidebar: {
    width: "280px",
    background: "linear-gradient(180deg, #2563EB 0%, #1e40af 100%)",
    padding: "30px 20px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "2px 0 10px rgba(0, 0, 0, 0.1)",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "40px",
    color: "white",
  },
  logoIcon: {
    fontSize: "32px",
  },
  logoText: {
    fontSize: "22px",
    fontWeight: "700",
    margin: 0,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    background: "transparent",
    border: "none",
    borderRadius: "10px",
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "15px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s ease",
    textAlign: "left",
  },
  navItemActive: {
    background: "rgba(255, 255, 255, 0.2)",
    color: "white",
    fontWeight: "600",
  },
  navIcon: {
    fontSize: "20px",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    background: "rgba(239, 68, 68, 0.2)",
    border: "none",
    borderRadius: "10px",
    color: "white",
    fontSize: "15px",
    fontWeight: "500",
    cursor: "pointer",
    marginTop: "auto",
  },
  main: {
    flex: 1,
    overflow: "auto",
  },
  topBar: {
    background: "white",
    padding: "30px 40px",
    borderBottom: "1px solid #E2E8F0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 5px 0",
  },
  subtitle: {
    fontSize: "15px",
    color: "#64748b",
    margin: 0,
  },
  profileCard: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    background: "#F8FAFC",
    padding: "12px 20px",
    borderRadius: "12px",
  },
  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563EB, #06B6D4)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "600",
  },
  profileName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 2px 0",
  },
  profileRole: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0,
  },
  content: {
    padding: "40px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  },
  statCard: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    transition: "all 0.3s ease",
  },
  statIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "14px",
    background: "#DCFCE7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 4px 0",
  },
  statLabel: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  section: {
    marginBottom: "40px",
  },
  sectionTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "20px",
  },
  table: {
    background: "white",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr",
    padding: "20px 24px",
    background: "#F8FAFC",
    borderBottom: "1px solid #E2E8F0",
  },
  th: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr",
    padding: "20px 24px",
    borderBottom: "1px solid #F1F5F9",
    transition: "background 0.2s ease",
  },
  td: {
    fontSize: "15px",
    color: "#1e293b",
    display: "flex",
    alignItems: "center",
  },
  patientCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  patientAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #06B6D4, #0891b2)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "600",
  },
  patientIdBadge: {
    background: "#F1F5F9",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#475569",
  },
  viewBtn: {
    padding: "8px 16px",
    background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  recordsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "20px",
  },
  recordCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    transition: "all 0.3s ease",
    border: "1px solid #E2E8F0",
  },
  recordHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    paddingBottom: "16px",
    borderBottom: "1px solid #F1F5F9",
  },
  recordPatient: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1e293b",
  },
  recordDate: {
    fontSize: "13px",
    color: "#64748b",
    background: "#F1F5F9",
    padding: "4px 12px",
    borderRadius: "6px",
  },
  recordBody: {
    marginBottom: "16px",
  },
  recordField: {
    marginBottom: "12px",
  },
  fieldLabel: {
    fontSize: "13px",
    color: "#64748b",
    display: "block",
    marginBottom: "4px",
  },
  fieldValue: {
    fontSize: "15px",
    color: "#1e293b",
    fontWeight: "500",
    display: "block",
  },
  viewDetailsBtn: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  formCard: {
    background: "white",
    borderRadius: "16px",
    padding: "32px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    maxWidth: "700px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
  },
  input: {
    padding: "14px 16px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    fontSize: "15px",
    fontFamily: "inherit",
    transition: "all 0.3s ease",
  },
  select: {
    padding: "14px 16px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    fontSize: "15px",
    fontFamily: "inherit",
    background: "white",
    cursor: "pointer",
  },
  submitBtn: {
    padding: "16px",
    background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
  },
  errorAlert: {
    background: "#FEE2E2",
    padding: "16px",
    borderRadius: "10px",
    color: "#991B1B",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
  },
  successAlert: {
    background: "#DCFCE7",
    padding: "16px",
    borderRadius: "10px",
    color: "#166534",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
  },
  alertIcon: {
    fontSize: "20px",
  },
  loadingContainer: {
    textAlign: "center",
    padding: "60px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #E2E8F0",
    borderTop: "4px solid #2563EB",
    borderRadius: "50%",
    margin: "0 auto 20px",
    animation: "spin 0.8s linear infinite",
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 40px",
    background: "white",
    borderRadius: "16px",
    border: "2px dashed #E2E8F0",
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "20px",
  },
  searchContainer: {
    position: "relative",
    marginBottom: "24px",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
  },
  searchInput: {
    width: "100%",
    padding: "14px 48px 14px 16px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    fontSize: "15px",
    fontFamily: "inherit",
    transition: "all 0.3s ease",
  },
  clearSearch: {
    position: "absolute",
    right: "32px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "#64748b",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
};

export default DoctorDashboard;
