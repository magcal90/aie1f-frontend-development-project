import { useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { TransactionContext } from "../contexts/TransactionContext";
import Spinner from "../components/Spinner";
import styles from "./EditTransactionPage.module.css";

function EditTransactionPage() {
  const { id } = useParams();
  const { transactions, loading, error } = useContext(TransactionContext);
  const transaction = transactions.find((t) => t.id === id);
 
  if (loading) {
    return (
      <div className={styles.panel}>
        <Spinner size={8} />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className={styles.panel}>
        <p>{error ? `Error: ${error}` : "Transaction not found."}</p>
        <Link to="/app/transactions">Back to Transactions</Link>
      </div>
    );
  }

  return <EditTransactionForm key={transaction.id} transaction={transaction} />;
}

function EditTransactionForm({ transaction }) {
  const navigate = useNavigate();
  const { updateTransaction, categories } = useContext(TransactionContext);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    date: transaction.date,
    description: transaction.description,
    categoryId: transaction.categoryId,
    amount: transaction.amount,
    type: transaction.type === "income" ? "income" : "expense",
  }));

  const typeCategories = categories.filter((c) => c.type === form.type);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setForm((prev) => ({
      ...prev,
      type,
      categoryId: categories.find((c) => c.type === type)?.id ?? "",
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (saving || transaction.pending) return;

    const description = form.description.trim();

    if (!description) {
      alert("Please enter a description.");
      return;
    }

    setSaving(true);

    void updateTransaction(transaction.id, {
      date: form.date,
      description,
      categoryId: form.categoryId,
      amount: Number(form.amount),
    });

    navigate("/app/transactions");
  };

  return (
    <div className={styles.panel}>
      <Link to="/app/transactions" className={styles.backLink}>
        ← Back to Transactions
      </Link>
      <h2 className={styles.name}>Edit transaction</h2>

      <form onSubmit={handleSubmit}>
        <div className={styles.section}>
          <div className={styles.editField}>
            <label className={styles.sectionLabel} htmlFor="description">
              Description
            </label>
            <input
              id="description"
              type="text"
              name="description"
              className={styles.input}
              value={form.description}
              onChange={handleChange}
              maxLength={100}
              required
              autoFocus
            />
          </div>
          <div className={styles.editField}>
            <label className={styles.sectionLabel} htmlFor="amount">
              Amount
            </label>
            <input
              id="amount"
              type="number"
              name="amount"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              className={styles.input}
              value={form.amount}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.editField}>
            <label className={styles.sectionLabel} htmlFor="date">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              className={styles.input}
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.editField}>
            <label className={styles.sectionLabel} htmlFor="type">
              Type
            </label>
            <select
              id="type"
              name="type"
              className={styles.input}
              value={form.type}
              onChange={handleTypeChange}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className={styles.editField}>
            <label className={styles.sectionLabel} htmlFor="category">
              Category
            </label>
            <select
              id="category"
              name="categoryId"
              className={styles.input}
              value={form.categoryId}
              onChange={handleChange}
              required
            >
              {typeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.editActions}>
          <button
            type="submit"
            className={styles.saveButton}
            disabled={saving || transaction.pending}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <Link to="/app/transactions" className={styles.cancelButton}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default EditTransactionPage;
