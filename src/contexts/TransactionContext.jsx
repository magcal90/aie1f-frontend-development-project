import {
  createContext,
  useMemo,
  useReducer,
  useState,
  useEffect,
  useRef,
} from "react";

import {
  transactionReducer,
  initialState,
} from "../reducers/transactionReducer";
import { API_BASE } from "../App";

// eslint-disable-next-line react-refresh/only-export-components
export const TransactionContext = createContext();

// match a category to a transaction and enrich it with category details
function enrichTransaction(transaction, categories) {
  const category = categories.find(
    (category) => category.id === transaction.categoryId,
  );

  return {
    ...transaction,
    category: category?.name ?? "Unknown",
    categoryIcon: category?.icon ?? "💰",
    type: category?.type ?? "unknown",
  };
}

// enrich a list of transactions with category details
function enrichTransactions(transactions, categories) {
  return transactions.map((transaction) =>
    enrichTransaction(transaction, categories),
  );
}

export function TransactionProvider({ children }) {
  const [state, dispatch] = useReducer(transactionReducer, initialState);
  const { transactions, loading, error, submitting } = state;
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [deleting, setDeleting] = useState(false);
  const pendingRequests = useRef(new Set());

  const displayedTransactions = useMemo(() => {
    return transactions
      .filter((transaction) =>
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      )
      .filter((transaction) =>
        typeFilter === "all" ? true : transaction.type === typeFilter,
      )
      .filter((transaction) =>
        categoryFilter === "all"
          ? true
          : transaction.categoryId === categoryFilter,
      )
      .filter((transaction) =>
        monthFilter === "all" ? true : transaction.date.startsWith(monthFilter),
      )
      .sort((a, b) => {
        if (sortBy === "date-desc") {
          return new Date(b.date) - new Date(a.date);
        }

        if (sortBy === "date-asc") {
          return new Date(a.date) - new Date(b.date);
        }

        if (sortBy === "amount-desc") {
          return Number(b.amount) - Number(a.amount);
        }

        if (sortBy === "amount-asc") {
          return Number(a.amount) - Number(b.amount);
        }

        return 0;
      });
  }, [
    transactions,
    searchTerm,
    typeFilter,
    categoryFilter,
    monthFilter,
    sortBy,
  ]);

  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: "FETCH_START" });

      try {
        const [transactionsResponse, categoriesResponse] = await Promise.all([
          fetch(`${API_BASE}/transactions`),
          fetch(`${API_BASE}/categories`),
        ]);

        if (!transactionsResponse.ok) {
          throw new Error(`Transactions error: ${transactionsResponse.status}`);
        }

        if (!categoriesResponse.ok) {
          throw new Error(`Categories error: ${categoriesResponse.status}`);
        }

        const transactionsData = await transactionsResponse.json();
        const categoriesData = await categoriesResponse.json();

        const safeTransactions = Array.isArray(transactionsData)
          ? transactionsData
          : [];
        const safeCategories = Array.isArray(categoriesData)
          ? categoriesData
          : [];

        setCategories(safeCategories);

        dispatch({
          type: "FETCH_SUCCESS",
          payload: enrichTransactions(safeTransactions, safeCategories),
        });
      } catch (err) {
        dispatch({ type: "FETCH_ERROR", payload: err.message });
      }
    };

    loadData();
  }, []);

  const addTransaction = async (transactionData) => {
    const requestKey = "create";

    if (pendingRequests.current.has(requestKey)) return;
    pendingRequests.current.add(requestKey);

    const temporaryId = `temp-${crypto.randomUUID()}`;

    const optimisticTransaction = {
      ...enrichTransaction({ ...transactionData, id: temporaryId }, categories),
      pending: true,
    };

    // Show the new transaction before the server responds.
    dispatch({
      type: "CREATE_OPTIMISTIC",
      payload: optimisticTransaction,
    });

    try {
      const response = await fetch(`${API_BASE}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const saved = enrichTransaction(await response.json(), categories);

      // Replace the temporary ID and clear the pending marker.
      dispatch({
        type: "CREATE_CONFIRMED",
        payload: { temporaryId, saved },
      });

      return saved;
    } catch (err) {
      dispatch({
        type: "CREATE_ROLLBACK",
        payload: temporaryId,
      });

      alert(`Transaction could not be saved: ${err.message}`);
    } finally {
      pendingRequests.current.delete(requestKey);
    }
  };

  const updateTransaction = async (transactionId, updates) => {
    const requestKey = `transaction-${transactionId}`;
    const original = transactions.find((item) => item.id === transactionId);

    if (
      !original ||
      original.pending ||
      pendingRequests.current.has(requestKey)
    ) {
      return;
    }

    pendingRequests.current.add(requestKey);

    // Display the edited values immediately.
    dispatch({
      type: "UPDATE_TRANSACTION",
      payload: {
        ...enrichTransaction({ ...original, ...updates }, categories),
        pending: true,
      },
    });

    try {
      const response = await fetch(
        `${API_BASE}/transactions/${transactionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        },
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const saved = enrichTransaction(await response.json(), categories);

      dispatch({
        type: "UPDATE_TRANSACTION",
        payload: saved,
      });

      return saved;
    } catch (err) {
      // Restore only this transaction, preserving other changes.
      dispatch({
        type: "UPDATE_TRANSACTION",
        payload: original,
      });

      alert(`Changes could not be saved and were reverted: ${err.message}`);
    } finally {
      pendingRequests.current.delete(requestKey);
    }
  };

  const deleteTransaction = async (transactionId) => {
    const deleteRequestKey = "delete";
    const requestKey = `transaction-${transactionId}`;
    const index = transactions.findIndex((item) => item.id === transactionId);
    const original = transactions[index];

    if (
      !original ||
      original.pending ||
      pendingRequests.current.has(requestKey) ||
      pendingRequests.current.has(deleteRequestKey)
    ) {
      return;
    }

    if (!window.confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    pendingRequests.current.add(deleteRequestKey);
    pendingRequests.current.add(requestKey);
    setDeleting(true);

    // Remove the transaction before sending the request.
    dispatch({
      type: "DELETE_TRANSACTION",
      payload: transactionId,
    });

    try {
      const response = await fetch(
        `${API_BASE}/transactions/${transactionId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (err) {
      dispatch({
        type: "RESTORE_TRANSACTION",
        payload: { transaction: original, index },
      });

      alert(`Deletion failed; the transaction was restored: ${err.message}`);
    } finally {
      pendingRequests.current.delete(deleteRequestKey);
      pendingRequests.current.delete(requestKey);
      setDeleting(false);
    }
  };

  const addCategory = (category) =>
    setCategories((prev) => [...prev, category]);

  const removeCategory = (categoryId) =>
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        categories,
        displayedTransactions,
        loading,
        error,
        submitting,
        deleting,
        searchTerm,
        typeFilter,
        categoryFilter,
        monthFilter,
        sortBy,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        setSearchTerm,
        setTypeFilter,
        setCategoryFilter,
        setMonthFilter,
        setSortBy,
        addCategory,
        removeCategory,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}
