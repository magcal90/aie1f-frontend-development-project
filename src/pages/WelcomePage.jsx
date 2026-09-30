// src/pages/WelcomePage.jsx
import { Link } from "react-router";
import styles from "./WelcomePage.module.css";
import kakeiboLogo from "../assets/kakeibo.png";

function WelcomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <img className={styles.logoMark} src={kakeiboLogo} alt="Kakeibo" />
        </div>

        <h1 className={styles.heading}>
          Kakeibo (かけいぼ) — Personal Finance Tracker
        </h1>
        <p className={styles.lead}>
          Manage your personal finances in one place.
        </p>

        <Link to="/login" className={styles.loginBtn}>
          Log In
        </Link>
      </div>
    </div>
  );
}

export default WelcomePage;
