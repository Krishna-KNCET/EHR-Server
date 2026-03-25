import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.badge}>🏥 Healthcare Innovation</div>
          <h1 style={styles.title}>Next-Generation Electronic Health Records</h1>
          <p style={styles.subtitle}>
            Secure, intelligent, and accessible healthcare management powered by AI.
            Transform patient care with our cutting-edge EHR platform.
          </p>

          <div style={styles.buttons}>
            <button style={styles.primaryBtn} onClick={() => navigate("/login")}>
              Get Started →
            </button>
            <button style={styles.secondaryBtn} onClick={() => navigate("/register")}>
              Create Account
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🔒</div>
            <h3 style={styles.featureTitle}>Secure & Compliant</h3>
            <p style={styles.featureDesc}>HIPAA-compliant security with end-to-end encryption</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🤖</div>
            <h3 style={styles.featureTitle}>AI-Powered Insights</h3>
            <p style={styles.featureDesc}>Advanced ML predictions for early disease detection</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>⚡</div>
            <h3 style={styles.featureTitle}>Fast & Reliable</h3>
            <p style={styles.featureDesc}>Real-time access to patient records from anywhere</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📊</div>
            <h3 style={styles.featureTitle}>Smart Analytics</h3>
            <p style={styles.featureDesc}>Comprehensive dashboards and health reports</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>© 2024 Hospital EHR Platform. All rights reserved.</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  hero: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "80px 40px",
  },
  heroContent: {
    textAlign: "center",
    marginBottom: "80px",
  },
  badge: {
    display: "inline-block",
    background: "rgba(37, 99, 235, 0.2)",
    color: "#60A5FA",
    padding: "8px 20px",
    borderRadius: "30px",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "24px",
    border: "1px solid rgba(96, 165, 250, 0.3)",
  },
  title: {
    fontSize: "56px",
    fontWeight: "800",
    color: "white",
    marginBottom: "24px",
    lineHeight: "1.2",
    maxWidth: "900px",
    margin: "0 auto 24px",
  },
  subtitle: {
    fontSize: "20px",
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: "40px",
    lineHeight: "1.6",
    maxWidth: "700px",
    margin: "0 auto 40px",
  },
  buttons: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    flexWrap: "wrap",
  },
  primaryBtn: {
    padding: "16px 40px",
    background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 20px rgba(37, 99, 235, 0.4)",
  },
  secondaryBtn: {
    padding: "16px 40px",
    background: "rgba(255, 255, 255, 0.1)",
    color: "white",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    backdropFilter: "blur(10px)",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "24px",
  },
  featureCard: {
    background: "rgba(255, 255, 255, 0.05)",
    padding: "32px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    transition: "all 0.3s ease",
  },
  featureIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  featureTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "white",
    marginBottom: "12px",
  },
  featureDesc: {
    fontSize: "15px",
    color: "rgba(255, 255, 255, 0.6)",
    lineHeight: "1.5",
    margin: 0,
  },
  footer: {
    textAlign: "center",
    padding: "40px",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: "14px",
    margin: 0,
  },
};

export default Home;