import { useState, useEffect } from "react";

const Notifications = ({ isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Mock notifications - replace with API call
    const mockNotifications = [
      {
        id: 1,
        icon: "✔",
        message: "ECG Prediction Completed",
        detail: "Patient ID: 83K29",
        timestamp: "10 minutes ago",
        read: false,
      },
      {
        id: 2,
        icon: "👤",
        message: "New patient registered",
        detail: "John Doe added to system",
        timestamp: "1 hour ago",
        read: false,
      },
      {
        id: 3,
        icon: "📄",
        message: "MRI uploaded",
        detail: "Brain scan report available",
        timestamp: "2 hours ago",
        read: true,
      },
      {
        id: 4,
        icon: "🩺",
        message: "Doctor added new record",
        detail: "Medical history updated",
        timestamp: "5 hours ago",
        read: true,
      },
    ];
    
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter((n) => !n.read).length);
  }, []);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const theme = isDarkMode
    ? {
        dropdown: {
          background: "#1e293b",
          border: "#334155",
        },
        card: {
          background: "#334155",
          hover: "#475569",
        },
        text: {
          primary: "#f1f5f9",
          secondary: "#94a3b8",
        },
      }
    : {
        dropdown: {
          background: "white",
          border: "#E2E8F0",
        },
        card: {
          background: "white",
          hover: "#F8FAFC",
        },
        text: {
          primary: "#1e293b",
          secondary: "#64748b",
        },
      };

  return (
    <div style={styles.container}>
      <button
        style={{
          ...styles.bellBtn,
          color: isDarkMode ? "#f1f5f9" : "#1e293b",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div style={styles.overlay} onClick={() => setIsOpen(false)} />
          <div
            style={{
              ...styles.dropdown,
              background: theme.dropdown.background,
              borderColor: theme.dropdown.border,
            }}
          >
            <div style={styles.dropdownHeader}>
              <h3
                style={{
                  ...styles.dropdownTitle,
                  color: theme.text.primary,
                }}
              >
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span style={styles.unreadText}>{unreadCount} unread</span>
              )}
            </div>

            <div style={styles.notificationList}>
              {notifications.length === 0 ? (
                <p
                  style={{
                    ...styles.emptyText,
                    color: theme.text.secondary,
                  }}
                >
                  No notifications
                </p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      ...styles.notificationCard,
                      background: notif.read
                        ? theme.card.background
                        : isDarkMode
                        ? "#1e3a5f"
                        : "#EFF6FF",
                    }}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div style={styles.notifIcon}>{notif.icon}</div>
                    <div style={styles.notifContent}>
                      <p
                        style={{
                          ...styles.notifMessage,
                          color: theme.text.primary,
                        }}
                      >
                        {notif.message}
                      </p>
                      <p
                        style={{
                          ...styles.notifDetail,
                          color: theme.text.secondary,
                        }}
                      >
                        {notif.detail}
                      </p>
                      <p style={styles.notifTime}>{notif.timestamp}</p>
                    </div>
                    {!notif.read && <span style={styles.unreadDot} />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: "relative",
  },
  bellBtn: {
    position: "relative",
    background: "transparent",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "8px",
    transition: "all 0.3s ease",
  },
  badge: {
    position: "absolute",
    top: "4px",
    right: "4px",
    background: "#EF4444",
    color: "white",
    fontSize: "11px",
    fontWeight: "700",
    padding: "2px 6px",
    borderRadius: "10px",
    minWidth: "18px",
    textAlign: "center",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    width: "380px",
    maxHeight: "500px",
    border: "1px solid",
    borderRadius: "16px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
    zIndex: 999,
    overflow: "hidden",
  },
  dropdownHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #E2E8F0",
  },
  dropdownTitle: {
    fontSize: "18px",
    fontWeight: "700",
    margin: 0,
  },
  unreadText: {
    fontSize: "13px",
    color: "#2563EB",
    fontWeight: "600",
  },
  notificationList: {
    maxHeight: "400px",
    overflowY: "auto",
  },
  notificationCard: {
    display: "flex",
    gap: "12px",
    padding: "16px 20px",
    borderBottom: "1px solid #F1F5F9",
    cursor: "pointer",
    transition: "all 0.2s ease",
    position: "relative",
  },
  notifIcon: {
    fontSize: "24px",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F1F5F9",
    borderRadius: "10px",
    flexShrink: 0,
  },
  notifContent: {
    flex: 1,
  },
  notifMessage: {
    fontSize: "15px",
    fontWeight: "600",
    margin: "0 0 4px 0",
  },
  notifDetail: {
    fontSize: "14px",
    margin: "0 0 4px 0",
  },
  notifTime: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: 0,
  },
  unreadDot: {
    position: "absolute",
    top: "20px",
    right: "20px",
    width: "8px",
    height: "8px",
    background: "#2563EB",
    borderRadius: "50%",
  },
  emptyText: {
    padding: "40px 20px",
    textAlign: "center",
    fontSize: "14px",
  },
};

export default Notifications;
