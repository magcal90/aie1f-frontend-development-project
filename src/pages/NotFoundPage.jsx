// src/pages/NotFoundPage.jsx
import { Link, useLocation } from "react-router";
import styles from "./NotFoundPage.module.css";

function NotFoundPage() {
  const location = useLocation();

  return (
    <div className={styles.statusMessage}>
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