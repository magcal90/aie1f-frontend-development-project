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

    case "ADD_START":
      return { ...state, submitting: true };

    case "ADD_TRANSACTION":
      return {
        ...state,
        submitting: false,
        transactions: [...state.transactions, action.payload],
      };

    case "ADD_ERROR":
      return { ...state, submitting: false };

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

    default:
      return state;
  }
}
