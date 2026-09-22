// src/components/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import styles from "./ProtectedRoute.module.css";

function ProtectedRoute({ requiredRole }) {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirect to login. Pass the current location so LoginPage can send the user back.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className={styles.statusMessage}>
        You do not have permission to view this page.
      </div>
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;