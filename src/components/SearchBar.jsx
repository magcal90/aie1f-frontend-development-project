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
    <div className={styles.searchBar} role="search">
      <label className={styles.searchField}>
        <span className={styles.visuallyHidden}>Search transactions</span>
      <input
        type="text"
        placeholder="Search transactions..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        />
      </label>

      <label className={styles.filterField}>
        <span className={styles.visuallyHidden}>Transaction type</span>
        <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
      >
        <option value="all">All Types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
        </select>
      </label>

      <label className={styles.filterField}>
        <span className={styles.visuallyHidden}>Transaction category</span>
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
      </label>

      <label className={styles.filterField}>
        <span className={styles.visuallyHidden}>Transaction month</span>
        <select
        value={monthFilter}
        onChange={(e) => setMonthFilter(e.target.value)}
      >
        <option value="all">All Months</option>
        <option value="2026-09">Sep 2026</option>
        <option value="2026-08">Aug 2026</option>
        <option value="2026-07">Jul 2026</option>
        </select>
      </label>

      <label className={styles.filterField}>
        <span className={styles.visuallyHidden}>Sort transactions</span>
        <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
      >
        <option value="date-desc">Newest First</option>
        <option value="date-asc">Oldest First</option>
        <option value="amount-desc">Amount: High to Low</option>
        <option value="amount-asc">Amount: Low to High</option>
        </select>
      </label>
    </div>
  );
}

export default SearchBar;
