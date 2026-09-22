import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { TransactionContext } from "../contexts/TransactionContext";
import TransactionsPage from "../pages/TransactionsPage";

function renderTransactionsPage(valueOverrides = {}) {
  const value = {
    displayedTransactions: [
      { id: 1, date: "2026-09-14", description: "Salary", category: "Salary", type: "income", amount: 2500 },
    ],
    loading: false,
    error: null,
    deleteTransaction: vi.fn(),
    ...valueOverrides,
  };

  return render(
    <MemoryRouter>
      <TransactionContext.Provider value={value}>
        <TransactionsPage />
      </TransactionContext.Provider>
    </MemoryRouter>
  );
}

describe("TransactionsPage", () => {
  it("renders the result count", () => {
    renderTransactionsPage();

    expect(screen.getByText("1 transaction found")).toBeInTheDocument();
  });

  it("shows the loading spinner while loading", () => {
    renderTransactionsPage({ loading: true, displayedTransactions: [] });

    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("shows an error message when loading fails", () => {
    renderTransactionsPage({
      error: "Network error",
      displayedTransactions: [],
      loading: false,
    });

    expect(screen.getByText(/Failed to load transactions: Network error/i)).toBeInTheDocument();
  });
});