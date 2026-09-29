import { expect, it } from "vitest";
import { initialState, transactionReducer } from "./transactionReducer";

it("toggles the transaction form", () => {
  const nextState = transactionReducer(initialState, { type: "TOGGLE_FORM" });

  expect(nextState.showForm).toBe(true);
  expect(initialState.showForm).toBe(false);
});

it("sets loading and clears an old error when fetching starts", () => {
  const state = { ...initialState, error: "Network error" };

  const nextState = transactionReducer(state, { type: "FETCH_START" });

  expect(nextState.loading).toBe(true);
  expect(nextState.error).toBeNull();
});

it("stops loading and stores an error when fetching fails", () => {
  const nextState = transactionReducer(initialState, {
    type: "FETCH_ERROR",
    payload: "Network error",
  });

  expect(nextState.loading).toBe(false);
  expect(nextState.error).toBe("Network error");
});

it("removes the transaction with the given id", () => {
  const state = {
    ...initialState,
    transactions: [{ id: 1 }, { id: 2 }],
  };

  const nextState = transactionReducer(state, {
    type: "DELETE_TRANSACTION",
    payload: 1,
  });

  expect(nextState.transactions).toEqual([{ id: 2 }]);
});