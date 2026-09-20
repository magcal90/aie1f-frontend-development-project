import TransactionItem from './TransactionItem'
import styles from './TransactionList.module.css'

function TransactionList({ transactions = [], onDelete }) {
  return (
    <div className={styles.statementBody}>
      {transactions.length === 0 ? (
        <p className={styles.emptyState}>No transactions match this view.</p>
      ) : (
        <>
          <div className={styles.statementColumns} aria-hidden="true">
            <span>Date</span>
            <span>Description</span>
            <span>Category</span>
            <span>Type</span>
            <span className={styles.amountColumn}>Amount</span>
            <span className={styles.actionColumn}>Action</span>
          </div>
          <ul className={styles.transactionList}>
            {transactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default TransactionList