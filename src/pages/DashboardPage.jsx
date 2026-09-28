import { useContext, useState } from "react";
import { Link } from "react-router";
import DashboardSummary from "../components/DashboardSummary";
import PageHeader from "../components/PageHeader";
import { TransactionContext } from "../contexts/TransactionContext";
import Spinner from "../components/Spinner";
import styles from "./DashboardPage.module.css";

function DashboardPage() {
  const { transactions, loading, error } = useContext(TransactionContext);
  const today = new Date();
  const year = today.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthKey = (month) => `${year}-${String(month + 1).padStart(2, "0")}`;
  const currentTransactions = (transactions || []).filter((t) =>
    t.date.startsWith(monthKey(today.getMonth())),
  );
  const selectedTransactions = (transactions || []).filter((t) =>
    t.date.startsWith(monthKey(selectedMonth)),
  );
  const availableMonths = [
    ...new Set(
      (transactions || [])
        .filter((t) => t.date.startsWith(`${year}-`))
        .map((t) => Number(t.date.slice(5, 7)) - 1),
    ),
  ].sort((a, b) => a - b);

  const activeMonth = availableMonths.includes(selectedMonth)
    ? selectedMonth
    : availableMonths.at(-1);

  const sumType = (items, type) =>
    items
      .filter((t) => t.type === type)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const income = sumType(currentTransactions, "income");
  const expenses = sumType(currentTransactions, "expense");

  const categories = Object.entries(
    selectedTransactions
      .filter((t) => t.type === "expense")
      .reduce((totals, t) => {
        totals[t.category] =
          (totals[t.category] || 0) + (Number(t.amount) || 0);
        return totals;
      }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const categoryTotal = categories.reduce((sum, [, amount]) => sum + amount, 0);
  // const totalSpent = categoryTotal;

  const recent = [...(transactions || [])]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const money = (amount) =>
    amount.toLocaleString("en-US", { style: "currency", currency: "SGD" });

  const categoryColors = {
    Food: "#087f5b",
    Shopping: "#d97706",
    Utilities: "#2563eb",
    Transport: "#b54736",
    Entertainment: "#0891b2",
  };
  const fallbackColors = ["#6d5bd0", "#64748b", "#a16207"];

  const colorForCategory = (category, index) =>
    categoryColors[category] ?? fallbackColors[index % fallbackColors.length];

  let angle = 0;
  const pieSlices = categories.map(([category, amount], index) => {
    const nextAngle =
      angle + (categoryTotal ? (amount / categoryTotal) * 100 : 0);
    const slice = `${colorForCategory(category, index)} ${angle}% ${nextAngle}%`;
    angle = nextAngle;
    return slice;
  });

  const pieBackground = categoryTotal
    ? `conic-gradient(${pieSlices.join(", ")})`
    : "var(--border-subtle)";

  if (loading) return <Spinner />;

  if (error) {
    return (
      <p className={styles.statusMessage}>Failed to load dashboard: {error}</p>
    );
  }

  return (
    <main className={styles.page}>
      <PageHeader
        eyebrow="Financial snapshot"
        title="Dashboard"
        subtitle="Overview of your finances"
      />

      <DashboardSummary transactions={transactions} />

      <section className={styles.metrics} aria-label="This month">
        <article>
          <span>This month's balance</span>
          <strong>{money(income - expenses)}</strong>
        </article>
        <article>
          <span>This month's income</span>
          <strong>
            {currentTransactions.some((t) => t.type === "income")
              ? money(income)
              : "Pending"}
          </strong>
        </article>
        <article>
          <span>This month's expenses</span>
          <strong>
            {currentTransactions.some((t) => t.type === "expense")
              ? money(expenses)
              : "Pending"}
          </strong>
        </article>
      </section>

      <section className={styles.panel} aria-label="Monthly trend">
        <h2>Monthly Trend</h2>
        <div className={styles.months}>
          {availableMonths.map((monthIndex) => (
            <button
              key={monthIndex}
              type="button"
              aria-pressed={activeMonth === monthIndex}
              className={activeMonth === monthIndex ? styles.monthSelected : ""}
              onClick={() => setSelectedMonth(monthIndex)}
            >
              {months[monthIndex]}
            </button>
          ))}
        </div>

        <div className={styles.detailRow}>
          <div className={styles.categoryColumn}>
            <h3>Spending by category</h3>
            {categories.length ? (
              <div className={styles.categoryChart}>
                <div
                  className={styles.pieChart}
                  style={{ background: pieBackground }}
                  role="img"
                  aria-label="Spending proportions by category"
                />

                <ul className={styles.categoryLegend}>
                  {categories.map(([category, amount], index) => {
                    const percent = Math.round((amount / categoryTotal) * 100);

                    return (
                      <li className={styles.legendItem} key={category}>
                        <span
                          className={styles.legendSwatch}
                          style={{
                            backgroundColor: colorForCategory(category, index),
                          }}
                          aria-hidden="true"
                        />
                        <span className={styles.legendCategory}>
                          {category}
                        </span>
                        <strong className={styles.legendAmount}>
                          {money(amount)}
                        </strong>
                        <span className={styles.legendPercent}>{percent}%</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p>No expense records for this month.</p>
            )}
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.recentHeader}>
          <h2>Recent transactions</h2>
          <Link to="/app/transactions">View all transactions</Link>
        </div>
        {recent.map((t) => (
          <div
            className={`${styles.recentRow} ${t.type === "income" ? styles.income : styles.expense}`}
            key={t.id}
          >
            <time>{t.date}</time>
            <span>{t.description}</span>
            <strong>
              {t.type === "income" ? "+" : "-"}
              {money(Number(t.amount) || 0)}
            </strong>
          </div>
        ))}
      </section>
    </main>
  );
}

export default DashboardPage
