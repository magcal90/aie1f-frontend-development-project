// Initial State
export const initialState = {
  transactions: [],
  loading: false,
  error: null,
  submitting: false,
};

// Reducer function
// action : { type: ..., payload: ... }
export function transactionReducer(state, action) {
  switch (action.type) {
    case "FETCH_START": {
      return {
        ...state,
        loading: true,
        error: null,
      };
    }
    case "FETCH_SUCCESS": {
      return {
        ...state,
        loading: false,
        // Guard against a non-array response (e.g. stale/misconfigured API server)
        transactions: Array.isArray(action.payload) ? action.payload : [],
      };
    }
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };

    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((c) =>
          c.id === action.payload.id ? action.payload : c,
        ),
      };

    case "DELETE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.filter((c) => c.id !== action.payload),
      };

    case "CREATE_OPTIMISTIC":
      return {
        ...state,
        submitting: true,
        transactions: [...state.transactions, action.payload],
      };

    case "CREATE_CONFIRMED":
      return {
        ...state,
        submitting: false,
        transactions: state.transactions.map((transaction) =>
          transaction.id === action.payload.temporaryId
            ? action.payload.saved
            : transaction,
        ),
      };

    case "CREATE_ROLLBACK":
      return {
        ...state,
        submitting: false,
        transactions: state.transactions.filter(
          (transaction) => transaction.id !== action.payload,
        ),
      };

    case "RESTORE_TRANSACTION": {
      const { transaction, index } = action.payload;

      // Prevent accidentally inserting the same item twice.
      if (state.transactions.some((item) => item.id === transaction.id)) {
        return state;
      }

      const transactions = [...state.transactions];
      transactions.splice(index, 0, transaction);

      return { ...state, transactions };
    }

    default:
      return state;
  }
}
