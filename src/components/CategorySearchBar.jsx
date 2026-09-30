import { memo } from "react";
import styles from "../pages/CategoriesPage.module.css";

function CategorySearchBar({ value, onChange }) {
  return (
    <div className={styles.searchBox}>
      <svg
        className={styles.searchIcon}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>

      <label className={styles.srOnly} htmlFor="search">
        Search categories by name
      </label>

      <input
        id="search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name..."
      />
    </div>
  );
}

export default memo(CategorySearchBar);
