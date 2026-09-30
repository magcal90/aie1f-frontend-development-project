// src/layouts/RootLayout.jsx
import { Outlet } from "react-router";
import Sidebar from "../components/Sidebar";
import styles from "./RootLayout.module.css";

function RootLayout() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

export default RootLayout;