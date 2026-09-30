import styles from "./DashboardSummary.module.css";

function DashboardSummary({ transactions = [] }) {
  const totals = transactions.reduce(
    (summary, transaction) => {
      const amount = Number(transaction.amount) || 0;

      if (transaction.type === "income") {
        summary.income += amount;
      } else if (transaction.type === "expense") {
        summary.expenses += amount;
      }

      return summary;
    },
    { income: 0, expenses: 0 },
  );
  const netBalance = totals.income - totals.expenses;
  const formatCurrency = (value) =>
    value.toLocaleString("en-US", { style: "currency", currency: "SGD" });

  return (
    <section
      className={`${styles.panel} ${styles.summaryPanel}`}
      aria-label="Balance summary">
      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>Net balance</span>
        <strong
          className={`${styles.summaryValue} ${netBalance >= 0 ? styles.positive : styles.negative}`}>
          {formatCurrency(netBalance)}
        </strong>
      </div>
      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>Total income</span>
        <strong className={styles.summaryValue}>
          {formatCurrency(totals.income)}
        </strong>
      </div>
      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>Total expenses</span>
        <strong className={styles.summaryValue}>
          {formatCurrency(totals.expenses)}
        </strong>
      </div>
    </section>
  )
}

export default DashboardSummary
