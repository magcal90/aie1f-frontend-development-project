import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useContext } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { TransactionContext, TransactionProvider } from "./TransactionContext";
import TransactionList from "../components/TransactionList";

vi.mock("../App", () => ({ API_BASE: "/api" }));

const categories = [
  { id: "food", name: "Food", type: "expense", icon: "🍜" },
];

const initialTransactions = [
  {
    id: "tx-1",
    date: "2026-09-14",
    description: "Original",
    categoryId: "food",
    amount: 10,
  },
];

const newTransaction = {
  date: "2026-09-15",
  description: "Coffee",
  categoryId: "food",
  amount: 5,
};

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function jsonResponse(data) {
  return { ok: true, status: 200, json: async () => data };
}

function createRequests() {
  const transactionLoad = deferred();
  const categoryLoad = deferred();
  const mutation = deferred();
  const fetchMock = vi.fn((url, options = {}) => {
    if (!options.method) {
      return url.endsWith("/transactions")
        ? transactionLoad.promise
        : categoryLoad.promise;
    }

    return mutation.promise;
  });

  vi.stubGlobal("fetch", fetchMock);
  return { transactionLoad, categoryLoad, mutation, fetchMock };
}

function TransactionProbe() {
  const {
    transactions,
    displayedTransactions,
    loading,
    deleting,
    addTransaction,
    addTransactions,
    updateTransaction,
    deleteTransaction,
  } = useContext(TransactionContext);

  if (loading) return <p>Loading data</p>;

  return (
    <>
      <button onClick={() => void addTransaction(newTransaction)}>Create</button>
      <button onClick={() => void addTransactions([
        { ...newTransaction, receiptId: "receipt-1", receiptLineId: "line-1" },
        { ...newTransaction, description: "Tea", receiptId: "receipt-1", receiptLineId: "line-2" },
      ])}>Create receipt</button>
      <button
        onClick={() =>
          void updateTransaction("tx-1", { description: "Updated" })
        }
      >
        Update
      </button>
      <output data-testid="delete-state">
        {deleting ? "Deleting" : "Idle"}
      </output>
      <output data-testid="transaction-count">{transactions.length}</output>
      <TransactionList
        transactions={displayedTransactions}
        onDelete={deleteTransaction}
        deleting={deleting}
      />
    </>
  );
}

async function renderProvider(transactions = initialTransactions) {
  const requests = createRequests();

  render(
    <MemoryRouter>
      <TransactionProvider>
        <TransactionProbe />
      </TransactionProvider>
    </MemoryRouter>,
  );

  await screen.findByText("Loading data");
  await act(async () => {
    requests.transactionLoad.resolve(jsonResponse(transactions));
    requests.categoryLoad.resolve(jsonResponse(categories));
    await Promise.all([
      requests.transactionLoad.promise,
      requests.categoryLoad.promise,
    ]);
  });

  await screen.findByRole("button", { name: "Create" });
  return requests;
}

beforeEach(() => {
  vi.stubGlobal("alert", vi.fn());
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("TransactionProvider optimistic mutations", () => {
  it("saves every receipt item sequentially and blocks duplicate submissions", async () => {
    const { mutation, fetchMock } = await renderProvider([]);
    fireEvent.click(screen.getByRole("button", { name: "Create receipt" }));
    fireEvent.click(screen.getByRole("button", { name: "Create receipt" }));
    expect(screen.getByTestId("transaction-count")).toHaveTextContent("2");
    expect(fetchMock.mock.calls.filter(([, options]) => options?.method === "POST")).toHaveLength(1);
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...newTransaction, id: "tea", description: "Tea" }));
    await act(async () => {
      mutation.resolve(jsonResponse({ ...newTransaction, id: "coffee" }));
    });
    await waitFor(() => expect(screen.queryByText("Saving…")).not.toBeInTheDocument());
    expect(fetchMock.mock.calls.filter(([, options]) => options?.method === "POST")).toHaveLength(2);
    expect(screen.getByText("Coffee")).toBeInTheDocument();
    expect(screen.getByText("Tea")).toBeInTheDocument();
  });

  it("keeps confirmed receipt items and removes unsaved optimistic items after failure", async () => {
    const { mutation, fetchMock } = await renderProvider([]);
    fireEvent.click(screen.getByRole("button", { name: "Create receipt" }));
    fetchMock.mockRejectedValueOnce(new Error("network failure"));
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    await act(async () => {
      mutation.resolve(jsonResponse({ ...newTransaction, id: "coffee", receiptLineId: "line-1" }));
    });
    await waitFor(() => expect(screen.queryByText("Tea")).not.toBeInTheDocument());
    expect(screen.getByText("Coffee")).toBeInTheDocument();
    expect(screen.getByTestId("transaction-count")).toHaveTextContent("1");
  });

  it("recovers a committed purchase after a lost POST response without posting it again", async () => {
    const { mutation, fetchMock } = await renderProvider([]);
    fireEvent.click(screen.getByRole("button", { name: "Create receipt" }));
    fetchMock.mockResolvedValueOnce(jsonResponse([
      { ...newTransaction, id: "coffee", receiptId: "receipt-1", receiptLineId: "line-1" },
    ]));
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...newTransaction, id: "tea", description: "Tea" }));
    await act(async () => {
      mutation.reject(new Error("lost response"));
    });
    await waitFor(() => expect(screen.queryByText("Saving…")).not.toBeInTheDocument());
    expect(screen.getByTestId("transaction-count")).toHaveTextContent("2");
    expect(fetchMock.mock.calls.filter(([, options]) => options?.method === "POST")).toHaveLength(2);
  });

  it("preserves receipt metadata when an imported purchase is edited", async () => {
    const { mutation, fetchMock } = await renderProvider([
      { ...initialTransactions[0], receiptId: "receipt-1", receiptLineId: "line-1", receiptTotal: 10.9, quantity: 2 },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    const body = JSON.parse(fetchMock.mock.calls.at(-1)[1].body);
    expect(body).toEqual({
      description: "Updated", receiptId: "receipt-1", receiptLineId: "line-1", receiptTotal: 10.9, quantity: 2,
    });
    await act(async () => mutation.resolve(jsonResponse({ ...initialTransactions[0], ...body })));
  });

  it("shows a created transaction before the request resolves and confirms it on success", async () => {
    const { mutation, fetchMock } = await renderProvider([]);

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(screen.getByText("Coffee")).toBeInTheDocument();
    expect(screen.getByText("Saving…")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/transactions",
      expect.objectContaining({ method: "POST" }),
    );

    await act(async () => {
      mutation.resolve(jsonResponse({ id: "tx-new", ...newTransaction }));
      await mutation.promise;
    });

    await waitFor(() =>
      expect(screen.queryByText("Saving…")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Coffee")).toBeInTheDocument();
  });

  it("removes an optimistic create when the request rejects", async () => {
    const { mutation } = await renderProvider([]);

    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(screen.getByText("Coffee")).toBeInTheDocument();

    await act(async () => {
      mutation.reject(new Error("network failure"));
      await mutation.promise.catch(() => {});
    });

    await waitFor(() =>
      expect(screen.queryByText("Coffee")).not.toBeInTheDocument(),
    );
    expect(alert).toHaveBeenCalled();
  });

  it("shows an edited transaction before the request resolves and confirms it on success", async () => {
    const { mutation } = await renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    expect(screen.getByText("Updated")).toBeInTheDocument();
    expect(screen.getByText("Saving…")).toBeInTheDocument();

    await act(async () => {
      mutation.resolve(
        jsonResponse({ ...initialTransactions[0], description: "Updated" }),
      );
      await mutation.promise;
    });

    await waitFor(() =>
      expect(screen.queryByText("Saving…")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Updated")).toBeInTheDocument();
  });

  it("restores the original transaction when an update request rejects", async () => {
    const { mutation } = await renderProvider();

    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(screen.getByText("Updated")).toBeInTheDocument();

    await act(async () => {
      mutation.reject(new Error("network failure"));
      await mutation.promise.catch(() => {});
    });

    await waitFor(() =>
      expect(screen.queryByText("Updated")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Original")).toBeInTheDocument();
    expect(alert).toHaveBeenCalled();
  });

  it("removes a transaction before delete resolves and keeps it deleted on success", async () => {
    const { mutation } = await renderProvider();

    fireEvent.click(
      screen.getByRole("button", { name: "Delete transaction: Original" }),
    );

    expect(screen.queryByText("Original")).not.toBeInTheDocument();
    expect(screen.getByTestId("delete-state")).toHaveTextContent("Deleting");

    await act(async () => {
      mutation.resolve(jsonResponse({}));
      await mutation.promise;
    });

    await waitFor(() =>
      expect(screen.getByTestId("delete-state")).toHaveTextContent("Idle"),
    );
    expect(screen.getByTestId("transaction-count")).toHaveTextContent("0");
  });

  it("serializes deletes and restores a failed deletion in the original order", async () => {
    const transactions = [
      { ...initialTransactions[0], id: "tx-1", description: "First" },
      { ...initialTransactions[0], id: "tx-2", description: "Second" },
      { ...initialTransactions[0], id: "tx-3", description: "Third" },
    ];
    const { mutation, fetchMock } = await renderProvider(transactions);

    fireEvent.click(
      screen.getByRole("button", { name: "Delete transaction: Second" }),
    );

    expect(screen.queryByText("Second")).not.toBeInTheDocument();
    const thirdDelete = screen.getByRole("button", {
      name: "Delete transaction: Third",
    });
    expect(thirdDelete).toBeDisabled();
    fireEvent.click(thirdDelete);
    expect(
      fetchMock.mock.calls.filter(([, options]) => options?.method === "DELETE"),
    ).toHaveLength(1);

    await act(async () => {
      mutation.reject(new Error("network failure"));
      await mutation.promise.catch(() => {});
    });

    await waitFor(() =>
      expect(screen.getAllByRole("listitem").map((row) => row.textContent)).toEqual(
        expect.arrayContaining([expect.stringContaining("First")]),
      ),
    );
    const restoredDescriptions = screen
      .getAllByRole("listitem")
      .map((row) => ["First", "Second", "Third"].find((name) => row.textContent.includes(name)));
    expect(restoredDescriptions).toEqual(["First", "Second", "Third"]);
    expect(screen.getByTestId("delete-state")).toHaveTextContent("Idle");
    expect(alert).toHaveBeenCalled();
  });
});