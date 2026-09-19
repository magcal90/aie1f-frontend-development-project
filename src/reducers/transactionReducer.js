// Initial State
export const initialState = {
  transactions: [],
  loading: false,
  error: null,
  submitting: false,
  showForm: false,
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
        transactions: action.payload,
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
        showForm: false,
        transactions: [...state.transactions, action.payload],
      };

    case "ADD_ERROR":
      return { ...state, submitting: false };

    case "TOGGLE_FORM":
      return { ...state, showForm: !state.showForm };

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
