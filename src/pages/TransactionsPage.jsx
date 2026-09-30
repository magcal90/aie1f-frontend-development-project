import { useContext } from "react";
import { Link } from "react-router";

import { TransactionContext } from "../contexts/TransactionContext";
import PageHeader from "../components/PageHeader";
import SearchBar from "../components/SearchBar";
import TransactionList from "../components/TransactionList";
import Spinner from "../components/Spinner";
import styles from "./TransactionsPage.module.css";

function TransactionsPage() {
  const {
    displayedTransactions,
    loading,
    error,
    deleting,
    deleteTransaction,
  } = useContext(TransactionContext);

  if (loading) return <Spinner />;

  if (error) {
    return <p className={styles.statusMessage}>Failed to load transactions: {error}</p>;
  }

  return (
    <main className={styles.page}>
      <PageHeader
        eyebrow="Money movement"
        title="Transactions"
        subtitle="View and manage your income and expenses."
        action={
          <Link to="/app/transactions/new" className={styles.addButton}>
            Add Transaction
          </Link>
        }
      />

      <SearchBar />

      <p className={styles.resultCount}>
        {displayedTransactions.length} transaction
        {displayedTransactions.length !== 1 ? "s" : ""} found
      </p>

      <section className={styles.statementPanel} aria-label="Transaction statement">
        <TransactionList
          transactions={displayedTransactions}
          onDelete={deleteTransaction}
          deleting={deleting}
        />
      </section>
    </main>
  );
}

export default TransactionsPage;