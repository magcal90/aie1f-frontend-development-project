// src/pages/NotFoundPage.jsx
import { Link, useLocation } from "react-router";

function NotFoundPage() {
  const location = useLocation();

  return (
    <div className="status-message">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>
        The page <code>{location.pathname}</code> does not exist in the Kakeibo (かけいぼ) — Personal Finance Tracker.
      </p>
      <Link to="/">Back to Home</Link>
    </div>
  );
}

export default NotFoundPage;