import { Trash2 } from "lucide-react";
import styles from "./TransactionItem.module.css";

// This component receives one transaction object and one onDelete function from its parent.
// In React, values passed from a parent component are called props.

function TransactionItem({ transaction, onDelete }) {
  const isIncome = transaction.type === "income";
  const typeClass = isIncome ? styles.income : styles.expense;
  const formattedAmount = Number(transaction.amount).toLocaleString("en-US", {
    style: "currency",
    currency: "SGD",
  });

  return (
    // <li> is an HTML list item. This component is meant to be rendered inside a <ul> list.
    <li className={`${styles.transactionRow} ${typeClass}`}>
      <span className={styles.transactionDate}>{transaction.date}</span>
      <div className={styles.transactionPrimary}>
        <span className={styles.transactionIcon} aria-hidden="true">
          {transaction.categoryIcon || "💰"}
        </span>
        <span>
          <span className={styles.transactionDescription}>
            {transaction.description}
          </span>
        </span>
      </div>
      <span className={styles.transactionCategory}>{transaction.category}</span>
      <span className={styles.transactionType}>
        <span className={`${styles.typeBadge} ${typeClass}`}>
          {transaction.type}
        </span>
      </span>
      {/* Curly braces let JSX run JavaScript inside the HTML-like markup. */}
      <span className={styles.transactionAmount}>
        {isIncome ? "+" : "-"}
        {formattedAmount}
      </span>
      {/* <button> is an HTML button. type="button" prevents it from submitting a form. */}
      <button
        className={styles.deleteButton}
        type="button"
        onClick={() => onDelete(transaction.id)}
      >
        <Trash2 className={styles.deleteIcon} aria-hidden="true" />
      </button>
    </li>
  );
}

export default TransactionItem;
