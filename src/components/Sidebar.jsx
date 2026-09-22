import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { NavLink } from "react-router";
import { LayoutDashboard, Users, LogOut } from "lucide-react";
import styles from "./Sidebar.module.css";

function initials(name) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function navLinkClass({ isActive }) {
  return styles.navItem + (isActive ? " " + styles.navItemActive : "");
}

function Sidebar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoMark}>
          <span />
          <span />
          <span />
          <span />
        </div>
        <span className={styles.logoText}>
          Kakeibo (かけいぼ) - Personal Finance Tracker
        </span>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navLabel}>Workspace</div>
        <NavLink to="/app/dashboard" className={navLinkClass}>
          <LayoutDashboard size={17} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/app/transactions" className={navLinkClass}>
          <Users size={17} />
          <span>Transactions</span>
        </NavLink>
      </nav>

      <div className={styles.foot}>
        <div className={styles.footAvatar}>{initials(user.name)}</div>
        <div className={styles.footWho}>
          <div className={styles.footName}>{user.name}</div>
          <span
            className={`${styles.roleBadge} ${user.role === "admin" ? styles.roleBadgeAdmin : styles.roleBadgeUser}`}>
            {user.role}
          </span>
        </div>
        <button className={styles.signOutBtn} onClick={logout} title="Sign out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
