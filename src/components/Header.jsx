import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import styles from "./Header.module.css";

function Header() {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Kakeibo (かけいぼ) — Personal Finance Tracker</h1>
      <div className={styles.userArea}>
        <span className={styles.userName}>{user.name}</span>
        <span
          className={`${styles.roleBadge} ${user.role === "admin" ? styles.roleBadgeAdmin : styles.roleBadgeUser}`}
        >
          {user.role}
        </span>
        <button className={styles.logoutBtn} onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  );
}

export default Header;
