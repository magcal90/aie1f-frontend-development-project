// src/layouts/RootLayout.jsx
import { useLayoutEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router";
import Sidebar from "../components/Sidebar";
import styles from "./RootLayout.module.css";

function RootLayout() {
  const { pathname } = useLocation();
  const contentRef = useRef(null);

  useLayoutEffect(() => {
    contentRef.current?.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [pathname]);

  return (
    <div className={styles.shell}>
      <Sidebar />

      <div ref={contentRef} className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

export default RootLayout;