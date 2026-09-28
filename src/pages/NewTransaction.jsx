import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router";

import { TransactionContext } from "../contexts/TransactionContext";
import PageHeader from "../components/PageHeader";
import styles from "./NewTransaction.module.css";

// en-CA formats as YYYY-MM-DD in local time, matching the <input type="date"> value
const today = () => new Date().toLocaleDateString("en-CA");

function NewTransaction() {
  const { addTransaction, submitting, categories } =
    useContext(TransactionContext);
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(today);
  const [error, setError] = useState(null);

  const typeCategories = categories.filter((c) => c.type === type);
  const selectedCategoryId = typeCategories.some((c) => c.id === categoryId)
    ? categoryId
    : (typeCategories[0]?.id ?? "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmed = description.trim();
    const numericAmount = Number(amount);

    if (!trimmed) {
      setError("Please enter a description.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }
    if (!selectedCategoryId) {
      setError("Please choose a category.");
      return;
    }

    const created = await addTransaction({
      date,
      description: trimmed,
      categoryId: selectedCategoryId,
      amount: numericAmount,
    });

    if (created) navigate("/app/transactions");
  };

  return (
    <main className={styles.page}>
      <PageHeader
        eyebrow="Money movement"
        title="New Transaction"
        subtitle="Record a new income or expense."
      />

      <section className={styles.card} aria-label="New transaction form">
        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.grid}>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label} htmlFor="description">
                Description
              </label>
              <input
                id="description"
                type="text"
                className={styles.input}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. NTUC FairPrice"
                maxLength={100}
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="amount">
                Amount
              </label>
              <input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                className={styles.input}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="date">
                Date
              </label>
              <input
                id="date"
                type="date"
                className={styles.input}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="type">
                Type
              </label>
              <select
                id="type"
                className={styles.input}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="category">
                Category
              </label>
              <select
                id="category"
                className={styles.input}
                value={selectedCategoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {typeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.actions}>
            <Link to="/app/transactions" className={styles.cancelButton}>
              Cancel
            </Link>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Save Transaction"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default NewTransaction;
