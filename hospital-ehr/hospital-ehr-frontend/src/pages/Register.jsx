import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const defaultFormData = {
  name: "",
  email: "",
  password: "",
  role: "patient",
};

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(defaultFormData);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const roleDescriptions = {
    patient: "Register as a patient to see records, reports, and doctor-verified AI updates.",
    doctor: "Register as a doctor to manage patients, upload reports, and review AI-assisted predictions.",
    admin: "Admin registration is for first-time setup. After the first admin account is created, use the Admin login tab to sign in.",
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await api.post("/auth/register", formData);

      if (response.data.success) {
        setFormData(defaultFormData);
        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Left Panel */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>🏥</div>
            <h1 style={styles.brandName}>EHR Platform</h1>
          </div>
          <h2 style={styles.leftTitle}>Join Our Healthcare Network</h2>
          <p style={styles.leftSubtitle}>Create your account and start your journey towards better health management.</p>
          <div style={styles.benefitsList}>
            <div style={styles.benefit}>✓ Secure health records</div>
            <div style={styles.benefit}>✓ AI-powered insights</div>
            <div style={styles.benefit}>✓ 24/7 access</div>
            <div style={styles.benefit}>✓ Expert medical care</div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <div style={styles.header}>
            <h2 style={styles.title}>Create Account</h2>
            <p style={styles.subtitle}>Fill in your details to get started. No default credentials are provided.</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div style={styles.successBox}>
              <span style={styles.successIcon}>✓</span>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>👤</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>📧</span>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>I am a...</label>
              <div style={styles.roleButtons}>
                <button
                  type="button"
                  style={{
                    ...styles.roleButton,
                    ...(formData.role === "patient" ? styles.roleButtonActive : {}),
                  }}
                  onClick={() => setFormData({ ...formData, role: "patient" })}
                >
                  👤 Patient
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.roleButton,
                    ...(formData.role === "doctor" ? styles.roleButtonActive : {}),
                  }}
                  onClick={() => setFormData({ ...formData, role: "doctor" })}
                >
                  👨‍⚕️ Doctor
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.roleButton,
                    ...(formData.role === "admin" ? styles.roleButtonActive : {}),
                  }}
                  onClick={() => setFormData({ ...formData, role: "admin" })}
                >
                  🛡️ Admin
                </button>
              </div>
              <div
                style={{
                  background: formData.role === "admin" ? "#FFF7ED" : "#EFF6FF",
                  border: `1px solid ${formData.role === "admin" ? "#FDBA74" : "#BFDBFE"}`,
                  borderRadius: "10px",
                  padding: "12px 14px",
                  color: "#334155",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
              >
                {roleDescriptions[formData.role]}
              </div>
            </div>

            <button type="submit" style={styles.submitButton} disabled={loading}>
              {loading ? (
                <span style={styles.loadingSpinner}></span>
              ) : (
                formData.role === "admin" ? "Create Admin Account" : "Create Account"
              )}
            </button>
          </form>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Already have an account?{" "}
              <span onClick={() => navigate("/login")} style={styles.link}>
                Sign In
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  leftPanel: {
    flex: 1,
    background: "linear-gradient(135deg, #2563EB 0%, #1e40af 100%)",
    padding: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  leftContent: {
    maxWidth: "500px",
    color: "white",
    zIndex: 1,
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "40px",
  },
  logoIcon: {
    fontSize: "40px",
  },
  brandName: {
    fontSize: "28px",
    fontWeight: "700",
    margin: 0,
  },
  leftTitle: {
    fontSize: "42px",
    fontWeight: "800",
    marginBottom: "20px",
    lineHeight: "1.2",
  },
  leftSubtitle: {
    fontSize: "18px",
    lineHeight: "1.6",
    marginBottom: "40px",
    opacity: 0.9,
  },
  benefitsList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  benefit: {
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontWeight: "500",
  },
  rightPanel: {
    flex: 1,
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },
  formContainer: {
    width: "100%",
    maxWidth: "480px",
  },
  header: {
    marginBottom: "32px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#64748b",
    margin: 0,
  },
  errorBox: {
    background: "#FEE2E2",
    padding: "14px 16px",
    borderRadius: "10px",
    color: "#991B1B",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "24px",
    fontSize: "14px",
  },
  errorIcon: {
    fontSize: "18px",
  },
  successBox: {
    background: "#DCFCE7",
    padding: "14px 16px",
    borderRadius: "10px",
    color: "#166534",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "24px",
    fontSize: "14px",
  },
  successIcon: {
    fontSize: "18px",
    fontWeight: "700",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "16px",
    fontSize: "18px",
    zIndex: 1,
  },
  input: {
    width: "100%",
    padding: "14px 16px 14px 48px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    fontSize: "15px",
    fontFamily: "inherit",
    transition: "all 0.3s ease",
    outline: "none",
  },
  roleButtons: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
  },
  roleButton: {
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    background: "white",
    fontSize: "15px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s ease",
    color: "#64748b",
  },
  roleButtonActive: {
    background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
    color: "white",
    border: "1px solid #2563EB",
  },
  submitButton: {
    marginTop: "8px",
    padding: "16px",
    background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  loadingSpinner: {
    width: "20px",
    height: "20px",
    border: "3px solid rgba(255, 255, 255, 0.3)",
    borderTop: "3px solid white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  footer: {
    marginTop: "24px",
    textAlign: "center",
  },
  footerText: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  link: {
    color: "#2563EB",
    fontWeight: "600",
    cursor: "pointer",
    textDecoration: "none",
  },
};

export default Register;