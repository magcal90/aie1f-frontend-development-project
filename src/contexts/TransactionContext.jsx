import { createContext, useReducer, useState, useEffect } from "react";

import {
  transactionReducer,
  initialState,
} from "../reducers/transactionReducer";
import { API_BASE } from "../App";

// eslint-disable-next-line react-refresh/only-export-components
export const TransactionContext = createContext();

export function TransactionProvider({ children }) {
  const [state, dispatch] = useReducer(transactionReducer, initialState);
  const { transactions, loading, error, submitting, showForm } = state;

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
      categoryFilter === "all" ? true : transaction.category === categoryFilter,
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
    const loadTransactions = async () => {
      dispatch({ type: "FETCH_START" });
      try {
        // Simulate network delay to show the loading spinner
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const response = await fetch(`${API_BASE}/transactions`);
        const data = await response.json();
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({ type: "FETCH_ERROR", payload: err.message });
      }
    };
    loadTransactions();
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
      dispatch({ type: "ADD_TRANSACTION", payload: createdTransaction });
      return createdTransaction; // ← ADD THIS LINE
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
      dispatch({ type: "UPDATE_TRANSACTION", payload: updated });
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
