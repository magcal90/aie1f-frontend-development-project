import { useAuth } from "../hooks/useAuth";
import { NavLink } from "react-router";
import { LayoutDashboard, Receipt, LogOut, Group } from "lucide-react";
import styles from "./Sidebar.module.css";
import kakeiboLogo from "../assets/kakeibo.png";

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
  const { user, logout } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <img className={styles.logoMark} src={kakeiboLogo} alt="Kakeibo" />
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
          <Receipt size={17} />
          <span>Transactions</span>
        </NavLink>
        <NavLink to="/app/categories" className={navLinkClass}>
          <Group size={17} />
          <span>Categories</span>
        </NavLink>
      </nav>

      <div className={styles.foot}>
        <div className={styles.footAvatar}>{initials(user.name)}</div>
        <div className={styles.footWho}>
          <div className={styles.footName}>{user.name}</div>
          <span
            className={`${styles.roleBadge} ${user.role === "admin" ? styles.roleBadgeAdmin : styles.roleBadgeUser}`}
          >
            {user.role}
          </span>
          <span
            className={`${styles.roleBadge} ${
              import.meta.env.DEV ? styles.roleBadgeUser : styles.roleBadgeAdmin
            }`}
          >
            {import.meta.env.MODE}
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
