import { useState } from "react";

const Modal = ({ isOpen, onClose, title, fileUrl, fileType }) => {
  const [zoom, setZoom] = useState(1);

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = title || "download";
    link.click();
  };

  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {fileType === "image" ? (
            <div style={styles.imageContainer}>
              <img
                src={fileUrl}
                alt={title}
                style={{ ...styles.image, transform: `scale(${zoom})` }}
              />
            </div>
          ) : fileType === "pdf" ? (
            <iframe src={fileUrl} style={styles.iframe} title={title}></iframe>
          ) : (
            <p>Unsupported file type</p>
          )}
        </div>

        {/* Footer Controls */}
        <div style={styles.footer}>
          {fileType === "image" && (
            <div style={styles.zoomControls}>
              <button style={styles.controlBtn} onClick={zoomOut}>
                🔍−
              </button>
              <span style={styles.zoomText}>{Math.round(zoom * 100)}%</span>
              <button style={styles.controlBtn} onClick={zoomIn}>
                🔍+
              </button>
            </div>
          )}
          <button style={styles.downloadBtn} onClick={handleDownload}>
            ⬇️ Download
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "white",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "900px",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #E2E8F0",
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: "24px",
    color: "#64748b",
    cursor: "pointer",
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    transition: "all 0.3s ease",
  },
  content: {
    flex: 1,
    overflow: "auto",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    overflow: "auto",
    maxHeight: "100%",
    display: "flex",
    justifyContent: "center",
  },
  image: {
    maxWidth: "100%",
    height: "auto",
    transition: "transform 0.3s ease",
  },
  iframe: {
    width: "100%",
    height: "600px",
    border: "none",
    borderRadius: "8px",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderTop: "1px solid #E2E8F0",
  },
  zoomControls: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  controlBtn: {
    padding: "8px 16px",
    background: "#F1F5F9",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  zoomText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748b",
    minWidth: "50px",
    textAlign: "center",
  },
  downloadBtn: {
    padding: "10px 24px",
    background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
};

export default Modal;
