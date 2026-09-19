import { useContext } from "react";
import { TransactionContext } from "../contexts/TransactionContext";
import styles from "./SearchBar.module.css";

function SearchBar() {
  const {
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter,
    monthFilter,
    setMonthFilter,
    sortBy,
    setSortBy,
  } = useContext(TransactionContext);

  return (
    <div className={styles.searchBar}>
      <input
        type="text"
        placeholder="Search transactions..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
      >
        <option value="all">All Types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>

      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
      >
        <option value="all">All Categories</option>
        <option value="Salary">Salary</option>
        <option value="Food">Food</option>
        <option value="Transport">Transport</option>
        <option value="Shopping">Shopping</option>
        <option value="Entertainment">Entertainment</option>
        <option value="Utilities">Utilities</option>
        <option value="Others">Others</option>
      </select>

      <select
        value={monthFilter}
        onChange={(e) => setMonthFilter(e.target.value)}
      >
        <option value="all">All Months</option>
        <option value="2026-09">Sep 2026</option>
        <option value="2026-08">Aug 2026</option>
        <option value="2026-07">Jul 2026</option>
      </select>

      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
      >
        <option value="date-desc">Newest First</option>
        <option value="date-asc">Oldest First</option>
        <option value="amount-desc">Amount: High to Low</option>
        <option value="amount-asc">Amount: Low to High</option>
      </select>
    </div>
  );
}

export default SearchBar;
