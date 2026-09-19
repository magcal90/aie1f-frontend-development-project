import TransactionItem from './TransactionItem'

function TransactionList({ transactions = [], onDelete }) {
  return (
    <div className="statement-body">
      {transactions.length === 0 ? (
        <p className="empty-state">No transactions match this view.</p>
      ) : (
        <>
          <div className="statement-columns" aria-hidden="true">
            <span>Description</span>
            <span>Type</span>
            <span className="amount-column">Amount</span>
            <span className="action-column">Action</span>
          </div>
        <ul className="transaction-list">
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