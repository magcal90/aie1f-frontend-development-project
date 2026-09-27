import { createContext, useReducer, useState, useEffect } from "react";

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
  const { transactions, loading, error, submitting, showForm } = state;
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  const displayedTransactions = transactions
    .filter((transaction) =>
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()),
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

  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: "FETCH_START" });

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

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

  // src/contexts/TransactionContext.jsx
  const addTransaction = async (transactionData) => {
    dispatch({ type: "ADD_START" });
    try {
      const response = await fetch(`${API_BASE}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const createdTransaction = await response.json();
      const enrichedTransaction = enrichTransaction(
        createdTransaction,
        categories,
      );
      dispatch({ type: "ADD_TRANSACTION", payload: enrichedTransaction });
      return enrichedTransaction;
    } catch (err) {
      dispatch({ type: "ADD_ERROR" });
      alert(`Failed to add transaction: ${err.message}`);
    }
  };

  const toggleForm = () => dispatch({ type: "TOGGLE_FORM" });

  const updateTransaction = async (transactionId, updates) => {
    try {
      const response = await fetch(
        `${API_BASE}/transactions/${transactionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        },
      );

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const updated = await response.json();
      const enrichedTransaction = enrichTransaction(updated, categories);

      dispatch({ type: "UPDATE_TRANSACTION", payload: enrichedTransaction });
    } catch (err) {
      alert(`Failed to update transaction: ${err.message}`);
    }
  };

  const deleteTransaction = async (transactionId) => {
    if (!window.confirm("Are you sure you want to delete this transaction?"))
      return;
    try {
      const response = await fetch(
        `${API_BASE}/transactions/${transactionId}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      dispatch({ type: "DELETE_TRANSACTION", payload: transactionId });

      if (selectedId === transactionId) setSelectedId(null);
    } catch (err) {
      alert(`Failed to delete transaction: ${err.message}`);
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        categories,
        displayedTransactions,
        loading,
        error,
        submitting,
        showForm,
        searchTerm,
        typeFilter,
        categoryFilter,
        monthFilter,
        sortBy,
        selectedId,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        toggleForm,
        setSearchTerm,
        setTypeFilter,
        setCategoryFilter,
        setMonthFilter,
        setSortBy,
        setSelectedId,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}
