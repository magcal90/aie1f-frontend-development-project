import { useContext, useState } from "react";
import { Link } from "react-router";
import DashboardSummary from "../components/DashboardSummary";
import PageHeader from "../components/PageHeader";
import { TransactionContext } from "../contexts/TransactionContext";
import Spinner from "../components/Spinner";
import styles from "./DashboardPage.module.css";

const monthNames = [
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

const categoryColors = {
  Food: "#087f5b",
  Shopping: "#d97706",
  Utilities: "#2563eb",
  Transport: "#b54736",
  Entertainment: "#0891b2",
};

const fallbackColors = [
  "#6d5bd0",
  "#e1ff39fe",
  "#4fd3ff",
  "#f133d8",
  "#f9ce8d",
];

function money(amount) {
  return Number(amount || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "SGD",
  });
}

function colorForCategory(category, index) {
  return categoryColors[category] ?? fallbackColors[index % fallbackColors.length];
}

function MonthlyMetrics({ income, expenses, hasIncome }) {
  return (
    <section className={styles.metrics} aria-label="This month">
      <article>
        <span>This month's balance</span>
        <strong>{money(income - expenses)}</strong>
      </article>

      <article>
        <span>This month's income</span>
        <strong>{hasIncome ? money(income) : "Pending"}</strong>
      </article>

      <article>
        <span>This month's expenses</span>
        <strong>{money(expenses)}</strong>
      </article>
    </section>
  );
}

function MonthlyTrend({
  availableMonths,
  selectedMonth,
  onMonthChange,
  categories,
}) {
  const categoryTotal = categories.reduce(
    (total, [, amount]) => total + amount,
    0,
  );

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

  return (
    <section className={styles.panel} aria-label="Monthly trend">
      <h2>Monthly Trend</h2>

      <div className={styles.months}>
        {availableMonths.map((monthIndex) => (
          <button
            key={monthIndex}
            type="button"
            aria-pressed={selectedMonth === monthIndex}
            className={
              selectedMonth === monthIndex ? styles.monthSelected : ""
            }
            onClick={() => onMonthChange(monthIndex)}
          >
            {monthNames[monthIndex]}
          </button>
        ))}
      </div>

      <h3>Spending by category</h3>

      {categories.length > 0 ? (
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
                  <span className={styles.legendCategory}>{category}</span>
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
    </section>
  );
}


function RecentTransactions({ transactions }) {
  return (
    <section className={styles.panel} aria-label="Recent transactions">
      <div className={styles.recentHeader}>
        <h2>Recent Transactions</h2>
        <Link to="/app/transactions">View all Transactions</Link>
      </div>

      {transactions.length > 0 ? (
        transactions.map((transaction) => (
          <div
            className={`${styles.recentRow} ${
              transaction.type === "income" ? styles.income : styles.expense
            }`}
            key={transaction.id}
          >
            <time dateTime={transaction.date}>{transaction.date}</time>
            <span>{transaction.description}</span>
            <strong>
              {transaction.type === "income" ? "+" : "-"}
              {money(transaction.amount)}
            </strong>
          </div>
        ))
      ) : (
        <p>No transactions yet.</p>
      )}
    </section>
  );
}

function DashboardPage() {
  const {
    transactions: contextTransactions,
    loading,
    error,
  } = useContext(TransactionContext);

  const transactions = Array.isArray(contextTransactions)
    ? contextTransactions
    : [];

  const today = new Date();
  const year = today.getFullYear();
  const currentMonth = today.getMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const monthKey = (monthIndex) =>
    `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  const availableMonths = [
    ...new Set(
      transactions
        .filter((transaction) => transaction.date?.startsWith(`${year}-`))
        .map((transaction) => Number(transaction.date.slice(5, 7)) - 1)
        .filter((monthIndex) => monthIndex >= 0 && monthIndex < 12),
    ),
  ].sort((a, b) => a - b);

  const activeMonth = availableMonths.includes(selectedMonth)
    ? selectedMonth
    : (availableMonths.at(-1) ?? currentMonth);

  const currentTransactions = transactions.filter((transaction) =>
    transaction.date?.startsWith(monthKey(currentMonth)),
  );

  const selectedTransactions = transactions.filter((transaction) =>
    transaction.date?.startsWith(monthKey(activeMonth)),
  );

  const totalForType = (items, type) =>
    items
      .filter((transaction) => transaction.type === type)
      .reduce(
        (total, transaction) => total + (Number(transaction.amount) || 0),
        0,
      );

  const income = totalForType(currentTransactions, "income");
  const expenses = totalForType(currentTransactions, "expense");
  const hasIncome = currentTransactions.some(
    (transaction) => transaction.type === "income",
  );

  const categories = Object.entries(
    selectedTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((totals, transaction) => {
        totals[transaction.category] =
          (totals[transaction.category] || 0) +
          (Number(transaction.amount) || 0);
        return totals;
      }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  if (loading) {
    return <Spinner />;
  }

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

      <MonthlyMetrics
        income={income}
        expenses={expenses}
        hasIncome={hasIncome}
      />

      <MonthlyTrend
        availableMonths={availableMonths}
        selectedMonth={activeMonth}
        onMonthChange={setSelectedMonth}
        categories={categories}
      />

      <RecentTransactions transactions={recentTransactions} />
    </main>
  );
}

export default DashboardPage