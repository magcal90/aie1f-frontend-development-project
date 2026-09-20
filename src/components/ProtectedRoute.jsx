// src/components/ProtectedRoute.jsx
import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { AuthContext } from "../contexts/AuthContext";
import styles from "./ProtectedRoute.module.css";

function ProtectedRoute({ requiredRole }) {
  const { user, hasRole } = useContext(AuthContext);
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