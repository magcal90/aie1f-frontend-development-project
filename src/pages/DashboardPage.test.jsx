import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { TransactionContext } from "../contexts/TransactionContext";
import DashboardPage from "./DashboardPage";

it("shows recent transactions newest first and links to all transactions", () => {
  const transactions = [
    {
      id: "old",
      date: "2026-08-10",
      description: "Older purchase",
      category: "Shopping",
      type: "expense",
      amount: 20,
    },
    {
      id: "new",
      date: "2026-09-20",
      description: "Latest purchase",
      category: "Food",
      type: "expense",
      amount: 15,
    },
  ];

  render(
    <MemoryRouter>
      <TransactionContext.Provider
        value={{ transactions, loading: false, error: null }}
      >
        <DashboardPage />
      </TransactionContext.Provider>
    </MemoryRouter>,
  );

  expect(
    screen.getByRole("heading", { name: "Dashboard" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Overview of your finances")).toBeInTheDocument();

  const recent = within(
    screen.getByRole("region", { name: "Recent transactions" }),
  );
  const latest = recent.getByText("Latest purchase");
  const older = recent.getByText("Older purchase");

  expect(
    latest.compareDocumentPosition(older) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();

  expect(
    recent.getByRole("link", { name: "View all transactions" }),
  ).toHaveAttribute("href", "/app/transactions");
});

it("shows empty states when there are no transactions", () => {
  render(
    <MemoryRouter>
      <TransactionContext.Provider
        value={{ transactions: [], loading: false, error: null }}
      >
        <DashboardPage />
      </TransactionContext.Provider>
    </MemoryRouter>,
  );

  expect(screen.getByText("No transactions yet.")).toBeInTheDocument();
  expect(
    screen.getByText("No expense records for this month."),
  ).toBeInTheDocument();
});

it("shows a newly added transaction when context updates", () => {
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const renderDashboard = (transactions) => (
    <MemoryRouter>
      <TransactionContext.Provider
        value={{ transactions, loading: false, error: null }}
      >
        <DashboardPage />
      </TransactionContext.Provider>
    </MemoryRouter>
  );

  const { rerender } = render(renderDashboard([]));

  expect(screen.getByText("No transactions yet.")).toBeInTheDocument();

  rerender(
    renderDashboard([
      {
        id: "new",
        date,
        description: "Coffee",
        category: "Food",
        type: "expense",
        amount: 5,
      },
    ]),
  );

  expect(
    within(
      screen.getByRole("region", { name: "Recent transactions" }),
    ).getByText("Coffee"),
  ).toBeInTheDocument();
});

it("shows a spinner while dashboard data is loading", () => {
  render(
    <TransactionContext.Provider
      value={{ transactions: [], loading: true, error: null }}
    >
      <DashboardPage />
    </TransactionContext.Provider>,
  );

  expect(screen.getByTestId("spinner")).toBeInTheDocument();
});

it("shows an error when dashboard data fails to load", () => {
  render(
    <TransactionContext.Provider
      value={{ transactions: [], loading: false, error: "Network error" }}
    >
      <DashboardPage />
    </TransactionContext.Provider>,
  );

  expect(
    screen.getByText("Failed to load dashboard: Network error"),
  ).toBeInTheDocument();
});