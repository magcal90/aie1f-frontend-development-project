// This component receives one transaction object and one onDelete function from its parent.
// In React, values passed from a parent component are called props.
function TransactionItem({ transaction, onDelete }) {
  const isIncome = transaction.type === 'income'
  const formattedAmount = Number(transaction.amount).toLocaleString('en-US', {
    style: 'currency', currency: 'USD',
  })

  return (
    // <li> is an HTML list item. This component is meant to be rendered inside a <ul> list.
    <li className={`transaction-row ${transaction.type}`}>
      <div className="transaction-primary">
        <span className="transaction-icon" aria-hidden="true">{isIncome ? 'IN' : 'OUT'}</span>
        <span>
          <span className="transaction-description">{transaction.description}</span>
          <span className="transaction-reference">Ref. {transaction.id}</span>
        </span>
      </div>
      <span className="transaction-type"><span className={`type-badge ${transaction.type}`}>{transaction.type}</span></span>
      {/* Curly braces let JSX run JavaScript inside the HTML-like markup. */}
      <span className="transaction-amount">{isIncome ? '+' : '-'}{formattedAmount}</span>
      {/* <button> is an HTML button. type="button" prevents it from submitting a form. */}
      <button className="delete-button" type="button" onClick={() => onDelete(transaction.id)}>
        Delete
      </button>
    </li>
  )
}

export default TransactionItem
