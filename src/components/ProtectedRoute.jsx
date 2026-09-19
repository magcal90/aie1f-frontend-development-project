// src/components/ProtectedRoute.jsx
import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { AuthContext } from "../contexts/AuthContext";

function ProtectedRoute({ requiredRole }) {
  const { user, hasRole } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    // Redirect to login. Pass the current location so LoginPage can send the user back.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="status-message error">
        You do not have permission to view this page.
      </div>
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;