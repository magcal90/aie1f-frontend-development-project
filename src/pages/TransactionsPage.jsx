import { useContext } from "react";
import { Link } from "react-router";

import { TransactionContext } from "../contexts/TransactionContext";
import SearchBar from "../components/SearchBar";
import TransactionList from "../components/TransactionList";
import Spinner from "../components/Spinner";

function TransactionsPage() {
  const {
    displayedTransactions,
    loading,
    error,
    deleteTransaction,
  } = useContext(TransactionContext);

  if (loading) return <Spinner />;

  if (error) {
    return <p>Failed to load transactions: {error}</p>;
  }

  return (
    <main>
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>View and manage your income and expenses.</p>
        </div>

        <Link to="/transactions/new">
          Add Transaction
        </Link>
      </div>

      <SearchBar />

      <p>
        {displayedTransactions.length} transaction
        {displayedTransactions.length !== 1 ? "s" : ""} found
      </p>

      <TransactionList
        transactions={displayedTransactions}
        onDelete={deleteTransaction}
      />
    </main>
  );
}

export default TransactionsPage;