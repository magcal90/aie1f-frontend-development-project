import { useContext } from "react";
import DashboardSummary from "../components/DashboardSummary";
import PageHeader from "../components/PageHeader";
import { TransactionContext } from "../contexts/TransactionContext";
import Spinner from "../components/Spinner";
import styles from "./DashboardPage.module.css";

function DashboardPage() {
  const { transactions, loading, error } = useContext(TransactionContext)

  if (loading) return <Spinner />

  if (error) {
    return (
      <p className={styles.statusMessage}>
        Failed to load dashboard: {error}
      </p>
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
    </main>
  );
}

export default DashboardPage
