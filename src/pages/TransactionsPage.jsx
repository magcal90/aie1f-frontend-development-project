import { useContext } from "react";
import { Link } from "react-router";

import { TransactionContext } from "../contexts/TransactionContext";
import SearchBar from "../components/SearchBar";
import TransactionList from "../components/TransactionList";
import Spinner from "../components/Spinner";
import styles from "./TransactionsPage.module.css";

function TransactionsPage() {
  const {
    displayedTransactions,
    loading,
    error,
    deleteTransaction,
  } = useContext(TransactionContext);

  if (loading) return <Spinner />;

  if (error) {
    return <p className={styles.statusMessage}>Failed to load transactions: {error}</p>;
  }

  return (
    <main className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Money movement</p>
          <h1>Transactions</h1>
          <p className={styles.subtitle}>View and manage your income and expenses.</p>
        </div>

        <Link to="/transactions/new" className={styles.addButton}>
          Add Transaction
        </Link>
      </div>

      <SearchBar />

      <p className={styles.resultCount}>
        {displayedTransactions.length} transaction
        {displayedTransactions.length !== 1 ? "s" : ""} found
      </p>

      <section className={styles.statementPanel} aria-label="Transaction statement">
        <TransactionList transactions={displayedTransactions} onDelete={deleteTransaction} />
      </section>
    </main>
  );
}

export default TransactionsPage;