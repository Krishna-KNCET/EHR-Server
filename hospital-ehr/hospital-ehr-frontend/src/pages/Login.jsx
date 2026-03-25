import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState("patient");
  const { login } = useAuth();
  const navigate = useNavigate();

  const portalContent = {
    patient: {
      heroTitle: "Patient EHR",
      subtitle: "Sign in to review your medical records, reports, and doctor updates.",
    },
    doctor: {
      heroTitle: "Doctor EHR",
      subtitle: "Sign in to manage patients, upload reports, and review AI-assisted insights.",
    },
    admin: {
      heroTitle: "Admin EHR",
      subtitle: "Sign in to manage access, doctors, and platform settings.",
    },
  };

  const activePortal = portalContent[loginType];

  const handleRoleChange = (nextLoginType) => {
    if (nextLoginType === loginType) {
      return;
    }

    setLoginType(nextLoginType);
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setError("");
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password, loginType);
    setLoading(false);

    if (result.success) {
      if (result.role === "doctor") navigate("/doctor-dashboard");
      if (result.role === "patient") navigate("/patient-dashboard");
      if (result.role === "admin") navigate("/admin-dashboard");
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={styles.container}>
      {/* Left Side - Medical Image/Gradient */}
      <div style={styles.leftPanel}>
        <div style={styles.overlay}>
          <div style={styles.brandSection}>
            <div style={styles.logoCircle}>🏥</div>
            <h1 style={styles.brandTitle}>{activePortal.heroTitle}</h1>
            <p style={styles.brandTagline}>{activePortal.subtitle}</p>
            <div style={styles.features}>
              <div style={styles.feature}>✓ Secure Patient Records</div>
              <div style={styles.feature}>✓ AI-Powered Predictions</div>
              <div style={styles.feature}>✓ Real-time Monitoring</div>
              <div style={styles.feature}>✓ HIPAA Compliant</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <h2 style={styles.welcomeText}>Welcome Back</h2>
          <p style={styles.loginSubtitle}>{activePortal.subtitle}</p>

          {/* Role Toggle */}
          <div style={styles.roleToggle}>
            <button
              type="button"
              style={{
                ...styles.roleButton,
                ...(loginType === "patient" ? styles.roleButtonActive : {}),
              }}
              onClick={() => handleRoleChange("patient")}
            >
              Patient
            </button>
            <button
              type="button"
              style={{
                ...styles.roleButton,
                ...(loginType === "doctor" ? styles.roleButtonActive : {}),
              }}
              onClick={() => handleRoleChange("doctor")}
            >
              Doctor
            </button>
            <button
              type="button"
              style={{
                ...styles.roleButton,
                ...(loginType === "admin" ? styles.roleButtonActive : {}),
              }}
              onClick={() => handleRoleChange("admin")}
            >
              Admin
            </button>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>⚠</span>
              {error}
            </div>
          )}

          <form key={loginType} onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>📧</span>
                <input
                  type="email"
                  placeholder={`Enter your ${loginType} email`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  style={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{
                ...styles.submitButton,
                ...(loading ? styles.submitButtonLoading : {}),
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerText}>or</span>
          </div>

          <p style={styles.signupText}>
            Don't have an account?{" "}
            <span style={styles.signupLink} onClick={() => navigate("/register")}>
              Create Account
            </span>
          </p>
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
    background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    background: "rgba(0, 0, 0, 0.2)",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandSection: {
    textAlign: "center",
    color: "white",
    padding: "40px",
  },
  logoCircle: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "48px",
    margin: "0 auto 30px",
    border: "3px solid rgba(255, 255, 255, 0.3)",
  },
  brandTitle: {
    fontSize: "42px",
    fontWeight: "700",
    marginBottom: "15px",
    letterSpacing: "-1px",
  },
  brandTagline: {
    fontSize: "18px",
    opacity: 0.95,
    marginBottom: "40px",
  },
  features: {
    textAlign: "left",
    maxWidth: "300px",
    margin: "0 auto",
  },
  feature: {
    fontSize: "16px",
    marginBottom: "15px",
    display: "flex",
    alignItems: "center",
    opacity: 0.9,
  },
  rightPanel: {
    flex: 1,
    background: "#F8FAFC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },
  formContainer: {
    width: "100%",
    maxWidth: "450px",
    background: "white",
    padding: "50px",
    borderRadius: "16px",
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
  },
  welcomeText: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "8px",
  },
  loginSubtitle: {
    fontSize: "15px",
    color: "#64748b",
    marginBottom: "30px",
  },
  roleToggle: {
    display: "flex",
    gap: "10px",
    marginBottom: "30px",
    background: "#F1F5F9",
    padding: "5px",
    borderRadius: "10px",
  },
  roleButton: {
    flex: 1,
    padding: "12px 20px",
    border: "none",
    background: "transparent",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748b",
    transition: "all 0.3s ease",
  },
  roleButtonActive: {
    background: "white",
    color: "#2563EB",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  },
  errorBox: {
    background: "#FEE2E2",
    border: "1px solid #FCA5A5",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "20px",
    color: "#991B1B",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  errorIcon: {
    fontSize: "18px",
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
    color: "#334155",
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
  },
  input: {
    width: "100%",
    padding: "14px 16px 14px 50px",
    borderRadius: "10px",
    border: "2px solid #E2E8F0",
    fontSize: "15px",
    transition: "all 0.3s ease",
    outline: "none",
    boxSizing: "border-box",
  },
  togglePassword: {
    position: "absolute",
    right: "16px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    padding: "5px",
  },
  submitButton: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "10px",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  submitButtonLoading: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  divider: {
    position: "relative",
    textAlign: "center",
    margin: "30px 0 20px",
  },
  dividerText: {
    background: "white",
    padding: "0 15px",
    color: "#94a3b8",
    fontSize: "14px",
    position: "relative",
    zIndex: 1,
  },
  signupText: {
    textAlign: "center",
    fontSize: "14px",
    color: "#64748b",
  },
  signupLink: {
    color: "#2563EB",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default Login;
