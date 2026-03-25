import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const HealthAnalytics = ({ isDarkMode }) => {
  const textColor = isDarkMode ? "#f1f5f9" : "#1e293b";
  const gridColor = isDarkMode ? "#334155" : "#E2E8F0";

  // Blood Sugar Trend Data
  const bloodSugarData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Blood Glucose (mg/dL)",
        data: [95, 110, 102, 98, 115, 105, 100],
        borderColor: "#2563EB",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  // Heart Rate Trend Data
  const heartRateData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Heart Rate (bpm)",
        data: [72, 75, 70, 78, 74, 76, 73],
        borderColor: "#EF4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  // Visit Frequency Data
  const visitData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Hospital Visits",
        data: [3, 2, 4, 1, 3, 2],
        backgroundColor: [
          "#2563EB",
          "#06B6D4",
          "#8B5CF6",
          "#F59E0B",
          "#10B981",
          "#EF4444",
        ],
        borderRadius: 8,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: textColor,
          font: { size: 12, weight: "600" },
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? "#1e293b" : "white",
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: gridColor,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: gridColor,
          display: false,
        },
        ticks: {
          color: textColor,
        },
      },
      y: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
    },
  };

  const barOptions = {
    ...lineOptions,
    plugins: {
      ...lineOptions.plugins,
      legend: {
        display: false,
      },
    },
  };

  const cardStyle = {
    background: isDarkMode ? "#1e293b" : "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: isDarkMode
      ? "0 2px 8px rgba(0, 0, 0, 0.3)"
      : "0 2px 8px rgba(0, 0, 0, 0.05)",
    border: isDarkMode ? "1px solid #334155" : "1px solid #E2E8F0",
  };

  const titleStyle = {
    fontSize: "18px",
    fontWeight: "700",
    color: textColor,
    marginBottom: "20px",
  };

  return (
    <div style={styles.container}>
      <h2
        style={{
          fontSize: "22px",
          fontWeight: "700",
          color: textColor,
          marginBottom: "24px",
        }}
      >
        📊 Health Analytics
      </h2>

      <div style={styles.grid}>
        {/* Blood Sugar Chart */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>Blood Sugar Trend</h3>
          <div style={{ height: "250px" }}>
            <Line data={bloodSugarData} options={lineOptions} />
          </div>
        </div>

        {/* Heart Rate Chart */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>Heart Rate / ECG Trend</h3>
          <div style={{ height: "250px" }}>
            <Line data={heartRateData} options={lineOptions} />
          </div>
        </div>

        {/* Visit Frequency Chart */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>Visit Frequency</h3>
          <div style={{ height: "250px" }}>
            <Bar data={visitData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginBottom: "40px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "24px",
  },
};

export default HealthAnalytics;
