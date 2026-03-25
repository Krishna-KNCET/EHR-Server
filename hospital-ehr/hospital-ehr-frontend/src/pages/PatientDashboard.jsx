import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import HealthAnalytics from "../components/HealthAnalytics";
import Notifications from "../components/Notifications";
import Modal from "../components/Modal";

const buildTrendStorageKeys = (currentUser) => {
  const identities = [
    currentUser?.id,
    currentUser?._id,
    currentUser?.patientId,
    currentUser?.email,
    "guest",
  ]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  return [...new Set(identities.map((value) => `ehr-confidence-trend-${value}`))];
};

const normalizeTrendShape = (value) => ({
  heart: Array.isArray(value?.heart) ? value.heart : [],
  diabetes: Array.isArray(value?.diabetes) ? value.diabetes : [],
  ecg: Array.isArray(value?.ecg) ? value.ecg : [],
});

const mergeTrendBuckets = (base, incoming) => ({
  heart: [...base.heart, ...incoming.heart].slice(-10),
  diabetes: [...base.diabetes, ...incoming.diabetes].slice(-10),
  ecg: [...base.ecg, ...incoming.ecg].slice(-10),
});

function PatientDashboard() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [localRunCounts, setLocalRunCounts] = useState({
    heart: 0,
    diabetes: 0,
    ecg: 0,
    total: 0,
  });

  const fileBaseUrl = import.meta.env.VITE_FILE_BASE_URL || "";
  const trendStorageKeys = buildTrendStorageKeys(user);

  const normalizeFileUrl = (filePath) => {
    if (!filePath) return "";
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      return filePath;
    }
    if (fileBaseUrl) {
      return `${fileBaseUrl.replace(/\/$/, "")}/${filePath.replace(/^\//, "")}`;
    }
    return filePath;
  };

  const detectFileType = (filePath) => {
    const cleanPath = (filePath || "").split("?")[0];
    return cleanPath.toLowerCase().endsWith(".pdf") ? "pdf" : "image";
  };

  const predictionRecords = records.filter((record) => Boolean(record.aiPrediction));
  const predictionHistory = records
    .filter((record) => Boolean(record.aiPredictions))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const latestStructuredPrediction = predictionHistory[0] || null;
  const totalLabReports = records.reduce(
    (count, record) => count + (Array.isArray(record.labReports) ? record.labReports.length : 0),
    0
  );
  const reportItems = records.flatMap((record) =>
    (record.labReports || []).map((reportPath, index) => ({
      id: `${record._id}-${index}`,
      diagnosis: record.diagnosis || "Report",
      createdAt: record.createdAt,
      doctorName: record.doctor?.name || record.doctor?.email || "Doctor",
      reportPath,
      reportUrl: normalizeFileUrl(reportPath),
      reportType: detectFileType(reportPath),
    }))
  );

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const res = await api.get("/records/my");
        setRecords(res.data?.data || []);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch records");
      } finally {
        setLoading(false);
      }
    };
    loadRecords();
  }, []);

  useEffect(() => {
    try {
      let merged = { heart: [], diabetes: [], ecg: [] };
      trendStorageKeys.forEach((key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        merged = mergeTrendBuckets(merged, normalizeTrendShape(parsed));
      });

      const heart = merged.heart.length;
      const diabetes = merged.diabetes.length;
      const ecg = merged.ecg.length;
      setLocalRunCounts({
        heart,
        diabetes,
        ecg,
        total: heart + diabetes + ecg,
      });
    } catch (_error) {
      setLocalRunCounts({ heart: 0, diabetes: 0, ecg: 0, total: 0 });
    }
  }, [trendStorageKeys.join("|"), activeSection]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleViewFile = (fileUrl, fileName, fileType) => {
    setSelectedFile({ url: fileUrl, name: fileName, type: fileType });
    setModalOpen(true);
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

  const predictionNotice = (
    <div
      style={{
        marginBottom: "20px",
        borderRadius: "14px",
        padding: "16px 18px",
        background: isDarkMode ? "rgba(245, 158, 11, 0.15)" : "#FFF7ED",
        border: `1px solid ${isDarkMode ? "#B45309" : "#FDBA74"}`,
      }}
    >
      <p style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: "700", color: theme.text }}>
        AI predictions are preliminary examples
      </p>
      <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: theme.textSecondary }}>
        Please verify every prediction with your doctor before making medical decisions or starting treatment.
      </p>
      <p style={{ margin: "8px 0 0", fontSize: "13px", lineHeight: "1.5", color: theme.textSecondary }}>
        Your local runs: Heart {localRunCounts.heart}, Diabetes {localRunCounts.diabetes}, ECG {localRunCounts.ecg} (Total {localRunCounts.total})
      </p>
    </div>
  );

  return (
    <div style={{ ...styles.container, background: theme.bg }}>
      {/* Sidebar */}
      <div style={{ ...styles.sidebar, background: theme.sidebarBg }}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🏥</div>
          <h2 style={styles.logoText}>EHR Portal</h2>
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
          <button
            style={{
              ...styles.navItem,
              ...(activeSection === "reports" ? styles.navItemActive : {}),
            }}
            onClick={() => setActiveSection("reports")}
          >
            <span style={styles.navIcon}>📁</span>
            Reports
          </button>
          <button
            style={styles.navItem}
            onClick={() => navigate("/health-prediction")}
          >
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
            <h1 style={{ ...styles.greeting, color: theme.text }}>Welcome back, {user?.email?.split("@")[0] || "Patient"}</h1>
            <p style={{ ...styles.subtitle, color: theme.textSecondary }}>Here's your health summary</p>
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
                <p style={{ ...styles.profileName, color: theme.text }}>{user?.email?.split("@")[0]}</p>
                <p style={{ ...styles.profileRole, color: theme.textSecondary }}>Patient</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div style={styles.content}>
          {activeSection === "dashboard" && (
            <>
              {/* Quick Stats */}
              <div style={styles.statsGrid}>
                <div style={{ ...styles.statCard, background: theme.cardBg, borderColor: theme.border }}>
                  <div style={styles.statIcon}>📋</div>
                  <div>
                    <p style={{ ...styles.statValue, color: theme.text }}>{loading ? "..." : records.length}</p>
                    <p style={{ ...styles.statLabel, color: theme.textSecondary }}>Medical Records</p>
                  </div>
                </div>
                <div style={{ ...styles.statCard, background: theme.cardBg, borderColor: theme.border }}>
                  <div style={{ ...styles.statIcon, background: "#DBEAFE" }}>🏥</div>
                  <div>
                    <p style={{ ...styles.statValue, color: theme.text }}>0</p>
                    <p style={{ ...styles.statLabel, color: theme.textSecondary }}>Upcoming Visits</p>
                  </div>
                </div>
                <div style={{ ...styles.statCard, background: theme.cardBg, borderColor: theme.border }}>
                  <div style={{ ...styles.statIcon, background: "#FEE2E2" }}>🤖</div>
                  <div>
                    <p style={{ ...styles.statValue, color: theme.text }}>
                      {loading ? "..." : predictionRecords.length}
                    </p>
                    <p style={{ ...styles.statLabel, color: theme.textSecondary }}>AI Predictions</p>
                  </div>
                </div>
                <div style={{ ...styles.statCard, background: theme.cardBg, borderColor: theme.border }}>
                  <div style={{ ...styles.statIcon, background: "#E0E7FF" }}>📄</div>
                  <div>
                    <p style={{ ...styles.statValue, color: theme.text }}>
                      {loading ? "..." : totalLabReports}
                    </p>
                    <p style={{ ...styles.statLabel, color: theme.textSecondary }}>Lab Reports</p>
                  </div>
                </div>
              </div>

              {/* Health Analytics */}
              <HealthAnalytics isDarkMode={isDarkMode} />

              {/* Latest Structured AI Prediction */}
              <div style={styles.section}>
                <h2 style={{ ...styles.sectionTitle, color: theme.text }}>Latest AI Risk Summary</h2>
                {!latestStructuredPrediction ? (
                  <div style={{ ...styles.emptyState, background: theme.cardBg, borderColor: theme.border }}>
                    <div style={styles.emptyIcon}>🧠</div>
                    <h3 style={{ color: theme.text }}>No Structured Predictions Yet</h3>
                    <p style={{ color: theme.textSecondary }}>Run an AI prediction to see heart, diabetes, and ECG insights.</p>
                    <button
                      onClick={() => navigate('/health-prediction')}
                      style={{
                        marginTop: '12px',
                        background: '#2563EB',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Run Prediction
                    </button>
                  </div>
                ) : (
                  <div style={{ ...styles.recordCard, background: theme.cardBg, borderColor: theme.border }}>
                    <div style={{ ...styles.recordField, marginBottom: '8px' }}>
                      <span style={{ ...styles.fieldLabel, color: theme.textSecondary }}>Heart Risk:</span>
                      <span style={{ ...styles.fieldValue, color: theme.text }}>{latestStructuredPrediction.aiPredictions?.heartRisk || 'N/A'}</span>
                    </div>
                    <div style={{ ...styles.recordField, marginBottom: '8px' }}>
                      <span style={{ ...styles.fieldLabel, color: theme.textSecondary }}>Diabetes Risk:</span>
                      <span style={{ ...styles.fieldValue, color: theme.text }}>{latestStructuredPrediction.aiPredictions?.diabetes || 'N/A'}</span>
                    </div>
                    <div style={{ ...styles.recordField, marginBottom: '8px' }}>
                      <span style={{ ...styles.fieldLabel, color: theme.textSecondary }}>ECG Result:</span>
                      <span style={{ ...styles.fieldValue, color: theme.text }}>{latestStructuredPrediction.aiPredictions?.ecgResult || 'N/A'}</span>
                    </div>
                    <div style={styles.recordField}>
                      <span style={{ ...styles.fieldLabel, color: theme.textSecondary }}>Confidence:</span>
                      <span style={{ ...styles.fieldValue, color: theme.text }}>
                        {typeof latestStructuredPrediction.aiPredictions?.confidence === 'number'
                          ? `${Math.round(latestStructuredPrediction.aiPredictions.confidence * 100)}%`
                          : 'N/A'}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate('/health-prediction')}
                      style={{
                        marginTop: '12px',
                        background: '#2563EB',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Run Prediction
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Medical Records */}
              <div style={styles.section}>
                <h2 style={{ ...styles.sectionTitle, color: theme.text }}>Recent Medical Records</h2>
                {loading ? (
                  <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <p>Loading your records...</p>
                  </div>
                ) : error ? (
                  <div style={styles.errorCard}>
                    <span style={styles.errorIcon}>⚠️</span>
                    <p>{error}</p>
                  </div>
                ) : records.length === 0 ? (
                  <div style={{ ...styles.emptyState, background: theme.cardBg, borderColor: theme.border }}>
                    <div style={styles.emptyIcon}>📋</div>
                    <h3 style={{ color: theme.text }}>No Medical Records Yet</h3>
                    <p style={{ color: theme.textSecondary }}>Your medical records will appear here once created by your doctor.</p>
                  </div>
                ) : (
                  <div style={styles.recordsGrid}>
                    {records.slice(0, 6).map((record) => {
                      const firstReport = Array.isArray(record.labReports) ? record.labReports[0] : null;
                      const reportUrl = normalizeFileUrl(firstReport);
                      const reportType = detectFileType(firstReport);
                      return (
                        <div key={record._id} style={{ ...styles.recordCard, background: theme.cardBg, borderColor: theme.border }}>
                          <div style={styles.recordHeader}>
                            <div style={{ ...styles.recordDoctor, color: theme.text }}>
                              👨‍⚕️ {record.doctor?.name || record.doctor?.email || "Doctor"}
                            </div>
                            <div style={{ ...styles.recordDate, background: theme.statBg, color: theme.textSecondary }}>
                              {new Date(record.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={styles.recordBody}>
                            <div style={styles.recordField}>
                              <span style={{ ...styles.fieldLabel, color: theme.textSecondary }}>Diagnosis:</span>
                              <span style={{ ...styles.fieldValue, color: theme.text }}>{record.diagnosis || "-"}</span>
                            </div>
                            <div style={styles.recordField}>
                              <span style={{ ...styles.fieldLabel, color: theme.textSecondary }}>Prescription:</span>
                              <span style={{ ...styles.fieldValue, color: theme.text }}>
                                {record.prescription || "-"}
                              </span>
                            </div>
                            {record.aiPrediction && (
                              <div style={styles.recordField}>
                                <span style={{ ...styles.fieldLabel, color: theme.textSecondary }}>AI Prediction:</span>
                                <span style={{ ...styles.fieldValue, color: theme.text }}>{record.aiPrediction}</span>
                                <span
                                  style={{
                                    display: "block",
                                    marginTop: "6px",
                                    fontSize: "12px",
                                    color: isDarkMode ? "#FCD34D" : "#B45309",
                                  }}
                                >
                                  Example only. Verify with your doctor.
                                </span>
                              </div>
                            )}
                          </div>
                          <div style={styles.buttonGroup}>
                            <button
                              style={{
                                ...styles.viewReportBtn,
                                opacity: firstReport ? 1 : 0.6,
                                cursor: firstReport ? "pointer" : "not-allowed",
                              }}
                              disabled={!firstReport}
                              onClick={() =>
                                firstReport &&
                                handleViewFile(
                                  reportUrl,
                                  `${record.diagnosis || "Medical"} Report`,
                                  reportType
                                )
                              }
                            >
                              {firstReport ? "👁️ View Report" : "No Report"}
                            </button>
                            <button style={styles.viewDetailsBtn}>View Details →</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* AI Predictions Section */}
              <div style={styles.section}>
                <h2 style={{ ...styles.sectionTitle, color: theme.text }}>AI Health Predictions</h2>
                {predictionNotice}
                {predictionRecords.length === 0 ? (
                  <div style={{ ...styles.emptyState, background: theme.cardBg, borderColor: theme.border }}>
                    <div style={styles.emptyIcon}>🤖</div>
                    <h3 style={{ color: theme.text }}>No Predictions Yet</h3>
                    <p style={{ color: theme.textSecondary }}>
                      Your AI prediction results will appear here after scan reports are uploaded.
                    </p>
                    {localRunCounts.total > 0 && (
                      <p style={{ color: theme.textSecondary, marginTop: "8px" }}>
                        You have already run {localRunCounts.total} prediction(s) from Run Prediction.
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={styles.predictionsGrid}>
                    {predictionRecords.slice(0, 3).map((record) => (
                      <div key={record._id} style={styles.predictionCard}>
                        <div style={styles.predictionIcon}>🤖</div>
                        <h3 style={styles.predictionTitle}>{record.diagnosis || "Scan Analysis"}</h3>
                        <div style={styles.predictionStatus}>{record.aiPrediction}</div>
                        <p style={styles.predictionDesc}>
                          By {record.doctor?.name || record.doctor?.email || "Doctor"} on {new Date(record.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeSection === "records" && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>All Medical Records</h2>
              {loading ? (
                <div style={styles.loadingContainer}>
                  <div style={styles.spinner}></div>
                  <p>Loading records...</p>
                </div>
              ) : records.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>📋</div>
                  <h3>No Medical Records</h3>
                  <p>Your medical records will appear here.</p>
                </div>
              ) : (
                <div style={styles.recordsGrid}>
                  {records.map((record) => (
                    <div key={record._id} style={styles.recordCard}>
                      <div style={styles.recordHeader}>
                        <div style={styles.recordDoctor}>
                          👨‍⚕️ {record.doctor?.name || record.doctor?.email || "Doctor"}
                        </div>
                        <div style={styles.recordDate}>
                          {new Date(record.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={styles.recordBody}>
                        <div style={styles.recordField}>
                          <span style={styles.fieldLabel}>Diagnosis:</span>
                          <span style={styles.fieldValue}>{record.diagnosis || "-"}</span>
                        </div>
                        <div style={styles.recordField}>
                          <span style={styles.fieldLabel}>Prescription:</span>
                          <span style={styles.fieldValue}>{record.prescription || "-"}</span>
                        </div>
                        {record.aiPrediction && (
                          <div style={styles.recordField}>
                            <span style={styles.fieldLabel}>AI Prediction:</span>
                            <span style={styles.fieldValue}>{record.aiPrediction}</span>
                            <span
                              style={{
                                display: "block",
                                marginTop: "6px",
                                fontSize: "12px",
                                color: isDarkMode ? "#FCD34D" : "#B45309",
                              }}
                            >
                              Example only. Verify with your doctor.
                            </span>
                          </div>
                        )}
                        {record.testResults && (
                          <div style={styles.recordField}>
                            <span style={styles.fieldLabel}>Test Results:</span>
                            <span style={styles.fieldValue}>{record.testResults}</span>
                          </div>
                        )}
                      </div>
                      <button style={styles.viewDetailsBtn}>View Full Record →</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === "predictions" && (
            <div style={styles.section}>
              <h2 style={{ ...styles.sectionTitle, color: theme.text }}>AI Health Predictions</h2>
              {predictionNotice}
              {predictionRecords.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>🤖</div>
                  <h3>No Predictions Yet</h3>
                  <p>Prediction results will appear once your doctor uploads scan reports.</p>
                  {localRunCounts.total > 0 && (
                    <p style={{ marginTop: "8px" }}>
                      You have already run {localRunCounts.total} prediction(s) locally.
                    </p>
                  )}
                </div>
              ) : (
                <div style={styles.predictionsGrid}>
                  {predictionRecords.map((record) => (
                    <div key={record._id} style={styles.predictionCard}>
                      <div style={styles.predictionIcon}>🤖</div>
                      <h3 style={styles.predictionTitle}>{record.diagnosis || "Scan Analysis"}</h3>
                      <div style={styles.predictionStatus}>{record.aiPrediction}</div>
                      <p style={styles.predictionDesc}>
                        By {record.doctor?.name || record.doctor?.email || "Doctor"} on {new Date(record.createdAt).toLocaleDateString()}
                      </p>
                      <p style={{ ...styles.predictionDesc, marginBottom: 0, color: "#B45309", fontWeight: "600" }}>
                        Example only. Please verify with your doctor.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === "reports" && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Lab Reports & Documents</h2>
              {reportItems.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>📁</div>
                  <h3>No Reports Available</h3>
                  <p>Your lab reports and medical documents will appear here.</p>
                </div>
              ) : (
                <div style={styles.recordsGrid}>
                  {reportItems.map((report) => (
                    <div key={report.id} style={styles.recordCard}>
                      <div style={styles.recordHeader}>
                        <div style={styles.recordDoctor}>📄 {report.diagnosis}</div>
                        <div style={styles.recordDate}>{new Date(report.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div style={styles.recordBody}>
                        <div style={styles.recordField}>
                          <span style={styles.fieldLabel}>Uploaded By:</span>
                          <span style={styles.fieldValue}>{report.doctorName}</span>
                        </div>
                        <div style={styles.recordField}>
                          <span style={styles.fieldLabel}>File:</span>
                          <span style={styles.fieldValue}>{report.reportPath.split("/").pop()}</span>
                        </div>
                      </div>
                      <button
                        style={styles.viewReportBtn}
                        onClick={() =>
                          handleViewFile(
                            report.reportUrl,
                            report.reportPath.split("/").pop(),
                            report.reportType
                          )
                        }
                      >
                        👁️ Open Report
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* File Preview Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedFile?.name}
        fileUrl={selectedFile?.url}
        fileType={selectedFile?.type}
      />
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
  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  themeToggle: {
    padding: "8px 16px",
    borderRadius: "10px",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    transition: "all 0.3s ease",
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
  recordDoctor: {
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
  buttonGroup: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  viewReportBtn: {
    padding: "12px",
    background: "linear-gradient(135deg, #06B6D4, #0891b2)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  viewDetailsBtn: {
    padding: "12px",
    background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  predictionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
  },
  predictionCard: {
    background: "white",
    borderRadius: "16px",
    padding: "32px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    textAlign: "center",
    border: "1px solid #E2E8F0",
    transition: "all 0.3s ease",
  },
  predictionIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  predictionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "12px",
  },
  predictionStatus: {
    display: "inline-block",
    padding: "6px 16px",
    background: "#F1F5F9",
    borderRadius: "20px",
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "12px",
  },
  predictionDesc: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "20px",
  },
  uploadBtn: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #06B6D4, #0891b2)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
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
  errorCard: {
    background: "#FEE2E2",
    padding: "20px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#991B1B",
  },
  errorIcon: {
    fontSize: "24px",
  },
};

export default PatientDashboard;
