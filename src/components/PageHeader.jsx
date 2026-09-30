import styles from "./PageHeader.module.css";

function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <header className={styles.header}>
      <div className={styles.titleBlock}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      {action && <div className={styles.action}>{action}</div>}
    </header>
  );
}

export default PageHeader;