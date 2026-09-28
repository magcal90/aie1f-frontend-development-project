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
