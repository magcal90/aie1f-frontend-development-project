import { expect, it } from "vitest";
import { initialState, transactionReducer } from "./transactionReducer";

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

it("replaces an optimistic transaction when creation is confirmed", () => {
  const optimisticTransaction = {
    id: "temp-1",
    description: "Groceries",
    pending: true,
  };
  const savedTransaction = {
    id: 3,
    description: "Groceries",
  };

  const optimisticState = transactionReducer(initialState, {
    type: "CREATE_OPTIMISTIC",
    payload: optimisticTransaction,
  });
  const confirmedState = transactionReducer(optimisticState, {
    type: "CREATE_CONFIRMED",
    payload: { temporaryId: "temp-1", saved: savedTransaction },
  });

  expect(confirmedState.transactions).toEqual([savedTransaction]);
  expect(confirmedState.submitting).toBe(false);
});

it("removes an optimistic transaction when creation fails", () => {
  const optimisticState = transactionReducer(initialState, {
    type: "CREATE_OPTIMISTIC",
    payload: { id: "temp-1", description: "Groceries", pending: true },
  });

  const rolledBackState = transactionReducer(optimisticState, {
    type: "CREATE_ROLLBACK",
    payload: "temp-1",
  });

  expect(rolledBackState.transactions).toEqual([]);
  expect(rolledBackState.submitting).toBe(false);
});

it("restores a deleted transaction at its original index", () => {
  const transactions = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const state = { ...initialState, transactions };
  const afterDelete = transactionReducer(state, {
    type: "DELETE_TRANSACTION",
    payload: 2,
  });

  const restoredState = transactionReducer(afterDelete, {
    type: "RESTORE_TRANSACTION",
    payload: { transaction: transactions[1], index: 1 },
  });

  expect(restoredState.transactions).toEqual(transactions);
});