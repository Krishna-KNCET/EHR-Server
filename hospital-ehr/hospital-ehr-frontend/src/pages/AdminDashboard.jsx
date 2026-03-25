import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Notifications from "../components/Notifications";

function AdminDashboard() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalRecords: 0,
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Theme colors
  const theme = {
    bg: isDarkMode ? '#0f172a' : '#F8FAFC',
    cardBg: isDarkMode ? '#1e293b' : 'white',
    text: isDarkMode ? '#f1f5f9' : '#1e293b',
    textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
    border: isDarkMode ? '#334155' : '#E2E8F0',
    statBg: isDarkMode ? '#334155' : '#F1F5F9',
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // In a real implementation, these would be admin API endpoints
        // For now, we'll show placeholder data
        setStats({
          totalUsers: 0,
          totalPatients: 0,
          totalDoctors: 0,
          totalRecords: 0,
        });
        setUsers([]);
      } catch (err) {
        console.error("Failed to load admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div style={{ ...styles.container, background: theme.bg }}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>⚡</div>
          <h2 style={styles.logoText}>Admin Portal</h2>
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
              ...(activeSection === "users" ? styles.navItemActive : {}),
            }}
            onClick={() => setActiveSection("users")}
          >
            <span style={styles.navIcon}>👥</span>
            User Management
          </button>
          <button
            style={{
              ...styles.navItem,
              ...(activeSection === "hospitals" ? styles.navItemActive : {}),
            }}
            onClick={() => setActiveSection("hospitals")}
          >
            <span style={styles.navIcon}>🏥</span>
            Hospitals
          </button>
          <button
            style={{
              ...styles.navItem,
              ...(activeSection === "activity" ? styles.navItemActive : {}),
            }}
            onClick={() => setActiveSection("activity")}
          >
            <span style={styles.navIcon}>📝</span>
            Activity Logs
          </button>
          <button
            style={{
              ...styles.navItem,
              ...(activeSection === "settings" ? styles.navItemActive : {}),
            }}
            onClick={() => setActiveSection("settings")}
          >
            <span style={styles.navIcon}>⚙️</span>
            Settings
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
            <h1 style={{ ...styles.greeting, color: theme.text }}>Admin Control Panel</h1>
            <p style={{ ...styles.subtitle, color: theme.textSecondary }}>System management and monitoring</p>
          </div>
          <div style={styles.topBarRight}>
            <button
              onClick={toggleTheme}
              style={{
                ...styles.themeToggle,
                background: theme.statBg,
                color: theme.text,
                borderColor: theme.border,
              }}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
            <Notifications isDarkMode={isDarkMode} />
            <div style={{ ...styles.profileCard, background: theme.statBg, borderColor: theme.border }}>
              <div style={styles.avatar}>{user?.email?.[0]?.toUpperCase()}</div>
              <div>
                <p style={{ ...styles.profileName, color: theme.text }}>{user?.email?.split("@")[0]}</p>
                <p style={{ ...styles.profileRole, color: theme.textSecondary }}>Administrator</p>
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
                <div style={{ ...styles.statCard, background: theme.cardBg, borderColor: theme.border }}>
                  <div style={{
                    ...styles.statIcon,
                    background: isDarkMode ? '#1e3a8a' : '#E0E7FF'
                  }}>👥</div>
                  <div>
                    <p style={{ ...styles.statValue, color: theme.text }}>{loading ? "..." : stats.totalUsers}</p>
                    <p style={{ ...styles.statLabel, color: theme.textSecondary }}>Total Users</p>
                  </div>
                </div>
                <div style={{ ...styles.statCard, background: theme.cardBg, borderColor: theme.border }}>
                  <div style={{
                    ...styles.statIcon,
                    background: isDarkMode ? '#164e63' : '#DBEAFE'
                  }}>🏥</div>
                  <div>
                    <p style={{ ...styles.statValue, color: theme.text }}>{loading ? "..." : stats.totalDoctors}</p>
                    <p style={{ ...styles.statLabel, color: theme.textSecondary }}>Total Doctors</p>
                  </div>
                </div>
                <div style={{ ...styles.statCard, background: theme.cardBg, borderColor: theme.border }}>
                  <div style={{
                    ...styles.statIcon,
                    background: isDarkMode ? '#7f1d1d' : '#FEE2E2'
                  }}>🤒</div>
                  <div>
                    <p style={{ ...styles.statValue, color: theme.text }}>{loading ? "..." : stats.totalPatients}</p>
                    <p style={{ ...styles.statLabel, color: theme.textSecondary }}>Total Patients</p>
                  </div>
                </div>
                <div style={{ ...styles.statCard, background: theme.cardBg, borderColor: theme.border }}>
                  <div style={{
                    ...styles.statIcon,
                    background: isDarkMode ? '#1e3a8a' : '#E0E7FF'
                  }}>📋</div>
                  <div>
                    <p style={{ ...styles.statValue, color: theme.text }}>{loading ? "..." : stats.totalRecords}</p>
                    <p style={{ ...styles.statLabel, color: theme.textSecondary }}>Medical Records</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={styles.section}>
                <h2 style={{ ...styles.sectionTitle, color: theme.text }}>Quick Actions</h2>
                <div style={styles.actionsGrid}>
                  <button
                    style={{ ...styles.actionCard, background: theme.cardBg, borderColor: theme.border }}
                    onClick={() => setActiveSection("users")}
                  >
                    <div style={{
                      ...styles.actionIcon,
                      background: isDarkMode ? '#1e40af' : '#E0E7FF',
                    }}>➕</div>
                    <h3 style={{ ...styles.actionTitle, color: theme.text }}>Add User</h3>
                    <p style={{ ...styles.actionDesc, color: theme.textSecondary }}>Create new user account</p>
                  </button>
                  <button
                    style={{ ...styles.actionCard, background: theme.cardBg, borderColor: theme.border }}
                    onClick={() => setActiveSection("hospitals")}
                  >
                    <div style={{
                      ...styles.actionIcon,
                      background: isDarkMode ? '#164e63' : '#DBEAFE',
                    }}>🏥</div>
                    <h3 style={{ ...styles.actionTitle, color: theme.text }}>Manage Hospitals</h3>
                    <p style={{ ...styles.actionDesc, color: theme.textSecondary }}>View and edit hospitals</p>
                  </button>
                  <button
                    style={{ ...styles.actionCard, background: theme.cardBg, borderColor: theme.border }}
                    onClick={() => setActiveSection("activity")}
                  >
                    <div style={{
                      ...styles.actionIcon,
                      background: isDarkMode ? '#134e4a' : '#CCFBF1',
                    }}>📊</div>
                    <h3 style={{ ...styles.actionTitle, color: theme.text }}>View Reports</h3>
                    <p style={{ ...styles.actionDesc, color: theme.textSecondary }}>System analytics & logs</p>
                  </button>
                  <button
                    style={{ ...styles.actionCard, background: theme.cardBg, borderColor: theme.border }}
                    onClick={() => setActiveSection("settings")}
                  >
                    <div style={{
                      ...styles.actionIcon,
                      background: isDarkMode ? '#831843' : '#FCE7F3',
                    }}>⚙️</div>
                    <h3 style={{ ...styles.actionTitle, color: theme.text }}>Settings</h3>
                    <p style={{ ...styles.actionDesc, color: theme.textSecondary }}>Configure system</p>
                  </button>
                </div>
              </div>

              {/* System Status */}
              <div style={styles.section}>
                <h2 style={{ ...styles.sectionTitle, color: theme.text }}>System Status</h2>
                <div style={styles.statusGrid}>
                  <div style={{ ...styles.statusCard, background: theme.cardBg, borderColor: theme.border }}>
                    <div style={styles.statusHeader}>
                      <span style={{ ...styles.statusTitle, color: theme.text }}>Database</span>
                      <span style={{
                        ...styles.statusBadge,
                        background: isDarkMode ? '#0f5132' : '#DCFCE7',
                        color: isDarkMode ? '#86efac' : '#166534'
                      }}>
                        ● Online
                      </span>
                    </div>
                    <p style={{ ...styles.statusDesc, color: theme.textSecondary }}>MongoDB connection active</p>
                  </div>
                  <div style={{ ...styles.statusCard, background: theme.cardBg, borderColor: theme.border }}>
                    <div style={styles.statusHeader}>
                      <span style={{ ...styles.statusTitle, color: theme.text }}>API Server</span>
                      <span style={{
                        ...styles.statusBadge,
                        background: isDarkMode ? '#0f5132' : '#DCFCE7',
                        color: isDarkMode ? '#86efac' : '#166534'
                      }}>
                        ● Running
                      </span>
                    </div>
                    <p style={{ ...styles.statusDesc, color: theme.textSecondary }}>Backend services operational</p>
                  </div>
                  <div style={{ ...styles.statusCard, background: theme.cardBg, borderColor: theme.border }}>
                    <div style={styles.statusHeader}>
                      <span style={{ ...styles.statusTitle, color: theme.text }}>ML Service</span>
                      <span style={{
                        ...styles.statusBadge,
                        background: isDarkMode ? '#713f12' : '#FEF3C7',
                        color: isDarkMode ? '#fde047' : '#92400E'
                      }}>
                        ● Pending
                      </span>
                    </div>
                    <p style={{ ...styles.statusDesc, color: theme.textSecondary }}>AI prediction service</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === "users" && (
            <div style={styles.section}>
              <h2 style={{ ...styles.sectionTitle, color: theme.text }}>User Management</h2>
              {loading ? (
                <div style={styles.loadingContainer}>
                  <div style={styles.spinner}></div>
                  <p style={{ color: theme.textSecondary }}>Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div style={{ ...styles.emptyState, background: theme.cardBg, borderColor: theme.border }}>
                  <div style={styles.emptyIcon}>👥</div>
                  <h3 style={{ color: theme.text }}>No Users Found</h3>
                  <p style={{ color: theme.textSecondary }}>User management features will be available here.</p>
                </div>
              ) : (
                <div style={styles.table}>
                  <div style={styles.tableHeader}>
                    <div style={styles.th}>User</div>
                    <div style={styles.th}>Email</div>
                    <div style={styles.th}>Role</div>
                    <div style={styles.th}>Status</div>
                    <div style={styles.th}>Actions</div>
                  </div>
                  {users.map((u) => (
                    <div key={u._id} style={styles.tableRow}>
                      <div style={styles.td}>{u.name || "N/A"}</div>
                      <div style={styles.td}>{u.email}</div>
                      <div style={styles.td}>
                        <span style={styles.roleBadge}>{u.role}</span>
                      </div>
                      <div style={styles.td}>
                        <span style={styles.statusBadge}>Active</span>
                      </div>
                      <div style={styles.td}>
                        <button style={styles.btnSmall}>Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === "hospitals" && (
            <div style={styles.section}>
              <h2 style={{ ...styles.sectionTitle, color: theme.text }}>Hospital Management</h2>
              <div style={{ ...styles.emptyState, background: theme.cardBg, borderColor: theme.border }}>
                <div style={styles.emptyIcon}>🏥</div>
                <h3 style={{ color: theme.text }}>Hospital Management</h3>
                <p style={{ color: theme.textSecondary }}>Hospital registration and management features coming soon.</p>
              </div>
            </div>
          )}

          {activeSection === "activity" && (
            <div style={styles.section}>
              <h2 style={{ ...styles.sectionTitle, color: theme.text }}>Activity Logs</h2>
              <div style={{ ...styles.emptyState, background: theme.cardBg, borderColor: theme.border }}>
                <div style={styles.emptyIcon}>📝</div>
                <h3 style={{ color: theme.text }}>Activity Logs</h3>
                <p style={{ color: theme.textSecondary }}>System activity logs and audit trails will appear here.</p>
              </div>
            </div>
          )}

          {activeSection === "settings" && (
            <div style={styles.section}>
              <h2 style={{ ...styles.sectionTitle, color: theme.text }}>System Settings</h2>
              <div style={{ ...styles.settingsCard, background: theme.cardBg, borderColor: theme.border }}>
                <h3 style={{ ...styles.settingsTitle, color: theme.text }}>General Settings</h3>
                <div style={{ ...styles.settingRow, borderColor: theme.border }}>
                  <div>
                    <p style={{ ...styles.settingLabel, color: theme.textSecondary }}>System Name</p>
                    <p style={{ ...styles.settingValue, color: theme.text }}>Hospital EHR System</p>
                  </div>
                </div>
                <div style={{ ...styles.settingRow, borderColor: theme.border }}>
                  <div>
                    <p style={{ ...styles.settingLabel, color: theme.textSecondary }}>Environment</p>
                    <p style={{ ...styles.settingValue, color: theme.text }}>Development</p>
                  </div>
                </div>
                <div style={{ ...styles.settingRow, borderColor: theme.border }}>
                  <div>
                    <p style={{ ...styles.settingLabel, color: theme.textSecondary }}>API Version</p>
                    <p style={{ ...styles.settingValue, color: theme.text }}>v1.0.0</p>
                  </div>
                </div>
              </div>
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
    background: "linear-gradient(180deg, #7C3AED 0%, #5B21B6 100%)",
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
    background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
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
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  },
  actionCard: {
    background: "white",
    padding: "32px 24px",
    borderRadius: "16px",
    border: "1px solid #E2E8F0",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  actionIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  actionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "8px",
  },
  actionDesc: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },
  statusCard: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  },
  statusHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  statusTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
  },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "500",
  },
  statusDesc: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  table: {
    background: "white",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr",
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
    gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr",
    padding: "20px 24px",
    borderBottom: "1px solid #F1F5F9",
  },
  td: {
    fontSize: "15px",
    color: "#1e293b",
    display: "flex",
    alignItems: "center",
  },
  roleBadge: {
    background: "#DBEAFE",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#1E40AF",
  },
  btnSmall: {
    padding: "6px 14px",
    background: "#2563EB",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
  },
  settingsCard: {
    background: "white",
    padding: "32px",
    borderRadius: "16px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    maxWidth: "700px",
  },
  settingsTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "24px",
  },
  settingRow: {
    padding: "20px 0",
    borderBottom: "1px solid #F1F5F9",
  },
  settingLabel: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 4px 0",
  },
  settingValue: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
  },
  loadingContainer: {
    textAlign: "center",
    padding: "60px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #E2E8F0",
    borderTop: "4px solid #7C3AED",
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
  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  themeToggle: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    background: "#F8FAFC",
    cursor: "pointer",
    fontSize: "20px",
    transition: "all 0.3s ease",
  },
};

export default AdminDashboard;