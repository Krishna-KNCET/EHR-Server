import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const initialHeart = {
  patientId: "",
  age: "",
  sex: "",
  cp: "",
  trestbps: "",
  chol: "",
  thalach: "",
};

const initialDiabetes = {
  patientId: "",
  glucose: "",
  bmi: "",
  insulin: "",
  age: "",
};

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

function HealthPrediction() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const defaultPatientId = user?.patientId || user?.id || "";
  const trendStorageKeys = useMemo(
    () => buildTrendStorageKeys(user),
    [user?.id, user?._id, user?.patientId, user?.email]
  );
  const primaryTrendStorageKey = trendStorageKeys[0];

  const [activeTab, setActiveTab] = useState("heart");
  const [heartForm, setHeartForm] = useState({ ...initialHeart, patientId: defaultPatientId });
  const [diabetesForm, setDiabetesForm] = useState({ ...initialDiabetes, patientId: defaultPatientId });
  const [ecgPatientId, setEcgPatientId] = useState(defaultPatientId);
  const [ecgFile, setEcgFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [confidenceTrendByType, setConfidenceTrendByType] = useState({
    heart: [],
    diabetes: [],
    ecg: [],
  });
  const [trendHydrated, setTrendHydrated] = useState(false);

  useEffect(() => {
    let merged = { heart: [], diabetes: [], ecg: [] };
    try {
      trendStorageKeys.forEach((key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return;
        merged = mergeTrendBuckets(merged, normalizeTrendShape(parsed));
      });
    } catch (_error) {
      // Ignore malformed cached trend data.
    }

    setConfidenceTrendByType(merged);
    setTrendHydrated(true);
  }, [trendStorageKeys]);

  useEffect(() => {
    if (!trendHydrated || !primaryTrendStorageKey) return;
    const payload = JSON.stringify(confidenceTrendByType);
    trendStorageKeys.forEach((key) => localStorage.setItem(key, payload));
  }, [confidenceTrendByType, trendHydrated, primaryTrendStorageKey, trendStorageKeys]);

  const palette = isDarkMode
    ? {
        bg: "#0f172a",
        card: "#1e293b",
        border: "#334155",
        text: "#e2e8f0",
        textMuted: "#94a3b8",
        primary: "#38bdf8",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
      }
    : {
        bg: "#f8fafc",
        card: "#ffffff",
        border: "#e2e8f0",
        text: "#0f172a",
        textMuted: "#64748b",
        primary: "#2563eb",
        success: "#16a34a",
        warning: "#d97706",
        danger: "#dc2626",
      };

  const confidenceValue = result?.confidence ? Number(result.confidence) : 0;
  const confidencePercent = Math.round(confidenceValue * 100);
  const activeTrendPoints = confidenceTrendByType[activeTab] || [];
  const activeTrendValues = activeTrendPoints.map((point) => point.value);

  const chartData = useMemo(
    () => ({
      labels: activeTrendPoints.map((point) => point.label),
      datasets: [
        {
          label: "Confidence Trend",
          data: activeTrendValues,
          borderColor: palette.primary,
          backgroundColor: "transparent",
          pointBackgroundColor: activeTrendValues.map((value) =>
            value >= 70 ? palette.danger : palette.success
          ),
          pointBorderColor: "#ffffff",
          pointBorderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 3,
          tension: 0.25,
          segment: {
            borderColor: (context) =>
              context.p1.parsed.y >= context.p0.parsed.y ? palette.success : palette.danger,
          },
          showLine: true,
          fill: false,
        },
      ],
    }),
    [activeTrendPoints, activeTrendValues, palette.primary, palette.danger, palette.success]
  );

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Confidence: ${context.parsed.y}%`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          color: palette.textMuted,
          callback: (value) => `${value}%`,
        },
        grid: { color: palette.border },
      },
      x: {
        ticks: { color: palette.textMuted },
        grid: { color: palette.border },
        title: {
          display: true,
          text: "Time",
          color: palette.textMuted,
        },
      },
    },
  };

  const setPredictionResult = (data, type, trendKey) => {
    const confidence = Number(data?.confidence || 0);
    const confidencePct = Math.round(confidence * 100);
    const runLabel = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setResult({ ...data, type });
    setConfidenceTrendByType((previous) => ({
      ...previous,
      [trendKey]: [...(previous[trendKey] || []).slice(-9), { value: confidencePct, label: runLabel }],
    }));
  };

  const getStatusColor = (predictionText) => {
    const text = (predictionText || "").toLowerCase();
    if (text.includes("high") || text.includes("abnormal")) return palette.danger;
    if (text.includes("low") || text.includes("normal")) return palette.success;
    return palette.warning;
  };

  const toNumberPayload = (formData) =>
    Object.fromEntries(
      Object.entries(formData).map(([key, value]) =>
        key === "patientId" ? [key, value] : [key, Number(value)]
      )
    );

  const runHeartPrediction = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const payload = toNumberPayload(heartForm);
      const res = await api.post("/predict/heart", payload);
      setPredictionResult(res.data.data, "Heart Disease", "heart");
    } catch (err) {
      setError(err.response?.data?.message || "Heart prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  const runDiabetesPrediction = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const payload = toNumberPayload(diabetesForm);
      const res = await api.post("/predict/diabetes", payload);
      setPredictionResult(res.data.data, "Diabetes", "diabetes");
    } catch (err) {
      setError(err.response?.data?.message || "Diabetes prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  const runEcgPrediction = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const payload = new FormData();
      payload.append("patientId", ecgPatientId);
      if (ecgFile) {
        payload.append("ecgFile", ecgFile);
      }

      const res = await api.post("/predict/ecg", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPredictionResult(res.data.data, "ECG", "ecg");
    } catch (err) {
      setError(err.response?.data?.message || "ECG prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: palette.bg, padding: "24px" }}>
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          background: palette.card,
          border: `1px solid ${palette.border}`,
          borderRadius: "16px",
          padding: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ margin: 0, color: palette.text }}>AI Health Prediction</h1>
            <p style={{ margin: "8px 0 0", color: palette.textMuted }}>
              Run heart disease, diabetes, and ECG risk checks from one screen.
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              border: `1px solid ${palette.border}`,
              borderRadius: "10px",
              background: "transparent",
              color: palette.text,
              padding: "10px 14px",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          {[
            { key: "heart", label: "Heart Prediction" },
            { key: "diabetes", label: "Diabetes Prediction" },
            { key: "ecg", label: "ECG Upload" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setError("");
                setResult(null);
              }}
              style={{
                background: activeTab === tab.key ? palette.primary : "transparent",
                color: activeTab === tab.key ? "#fff" : palette.text,
                border: `1px solid ${palette.border}`,
                borderRadius: "999px",
                padding: "10px 16px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "heart" && (
          <form onSubmit={runHeartPrediction} style={{ display: "grid", gap: "12px" }}>
            <Input label="Patient ID" value={heartForm.patientId} onChange={(value) => setHeartForm({ ...heartForm, patientId: value })} />
            <Input label="Age" type="number" value={heartForm.age} onChange={(value) => setHeartForm({ ...heartForm, age: value })} />
            <div style={{ display: "grid", gap: "6px" }}>
              <label style={{ fontWeight: 600 }}>Sex</label>
              <select
                required
                value={heartForm.sex}
                onChange={(event) => setHeartForm({ ...heartForm, sex: event.target.value })}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  fontSize: "14px",
                  background: "#ffffff",
                }}
              >
                <option value="" disabled>
                  Select sex
                </option>
                <option value="1">Male</option>
                <option value="0">Female</option>
              </select>
            </div>
            <Input label="Chest Pain Type (cp)" type="number" value={heartForm.cp} onChange={(value) => setHeartForm({ ...heartForm, cp: value })} />
            <Input label="Blood Pressure (trestbps)" type="number" value={heartForm.trestbps} onChange={(value) => setHeartForm({ ...heartForm, trestbps: value })} />
            <Input label="Cholesterol (chol)" type="number" value={heartForm.chol} onChange={(value) => setHeartForm({ ...heartForm, chol: value })} />
            <Input label="Max Heart Rate (thalach)" type="number" value={heartForm.thalach} onChange={(value) => setHeartForm({ ...heartForm, thalach: value })} />
            <ActionButton label={loading ? "Predicting..." : "Run Heart Prediction"} color={palette.primary} disabled={loading} />
          </form>
        )}

        {activeTab === "diabetes" && (
          <form onSubmit={runDiabetesPrediction} style={{ display: "grid", gap: "12px" }}>
            <Input label="Patient ID" value={diabetesForm.patientId} onChange={(value) => setDiabetesForm({ ...diabetesForm, patientId: value })} />
            <Input label="Glucose" type="number" value={diabetesForm.glucose} onChange={(value) => setDiabetesForm({ ...diabetesForm, glucose: value })} />
            <Input label="BMI" type="number" value={diabetesForm.bmi} onChange={(value) => setDiabetesForm({ ...diabetesForm, bmi: value })} />
            <Input label="Insulin" type="number" value={diabetesForm.insulin} onChange={(value) => setDiabetesForm({ ...diabetesForm, insulin: value })} />
            <Input label="Age" type="number" value={diabetesForm.age} onChange={(value) => setDiabetesForm({ ...diabetesForm, age: value })} />
            <ActionButton label={loading ? "Predicting..." : "Run Diabetes Prediction"} color={palette.primary} disabled={loading} />
          </form>
        )}

        {activeTab === "ecg" && (
          <form onSubmit={runEcgPrediction} style={{ display: "grid", gap: "12px" }}>
            <Input label="Patient ID" value={ecgPatientId} onChange={(value) => setEcgPatientId(value)} />
            <label style={{ color: palette.text, fontWeight: 600 }}>ECG File</label>
            <input
              type="file"
              accept=".csv,.txt,.dat"
              onChange={(event) => setEcgFile(event.target.files?.[0] || null)}
              style={{ color: palette.text }}
            />
            <ActionButton label={loading ? "Predicting..." : "Run ECG Prediction"} color={palette.primary} disabled={loading} />
          </form>
        )}

        {error && (
          <div
            style={{
              marginTop: "20px",
              padding: "12px 14px",
              borderRadius: "10px",
              border: `1px solid ${palette.danger}`,
              color: palette.danger,
              background: "rgba(239,68,68,0.08)",
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <div
            style={{
              marginTop: "24px",
              border: `1px solid ${palette.border}`,
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <h3 style={{ marginTop: 0, color: palette.text }}>{result.type} Result</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <strong style={{ color: palette.text }}>Prediction: {result.prediction}</strong>
              <span
                style={{
                  background: getStatusColor(result.prediction),
                  color: "#fff",
                  borderRadius: "999px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {result.prediction}
              </span>
            </div>
            <p style={{ color: palette.textMuted, margin: "8px 0 16px" }}>Confidence: {confidencePercent}%</p>
            <p style={{ color: palette.textMuted, margin: "-8px 0 16px" }}>
              Model Source Check: {result.source === "model" ? "Trained model is used" : "Fallback logic is used"}
            </p>
            <Line data={chartData} options={chartOptions} />
            {activeTrendPoints.length < 2 && (
              <p style={{ color: palette.textMuted, margin: "10px 0 0" }}>
                Add one more real run to see a connected trend line.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <div style={{ display: "grid", gap: "6px" }}>
      <label style={{ fontWeight: 600 }}>{label}</label>
      <input
        type={type}
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
        style={{
          border: "1px solid #cbd5e1",
          borderRadius: "10px",
          padding: "10px 12px",
          fontSize: "14px",
        }}
      />
    </div>
  );
}

function ActionButton({ label, color, disabled }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        marginTop: "6px",
        background: color,
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "12px 16px",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {label}
    </button>
  );
}

export default HealthPrediction;
