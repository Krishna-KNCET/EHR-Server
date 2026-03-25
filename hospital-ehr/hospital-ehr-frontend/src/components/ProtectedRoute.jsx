import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#334155" }}>
        Verifying session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallbackByRole = {
      patient: "/patient-dashboard",
      doctor: "/doctor-dashboard",
      admin: "/admin-dashboard",
    };

    return <Navigate to={fallbackByRole[user.role] || "/"} replace />;
  }

  return children;
};

export default ProtectedRoute;