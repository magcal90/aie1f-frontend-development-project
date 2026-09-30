import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import TransactionList from "./TransactionList";

const transactions = [
  {
    id: 1,
    date: "2026-09-14",
    description: "Salary",
    category: "Salary",
    type: "income",
    amount: 2500,
  },
  {
    id: 2,
    date: "2026-09-15",
    description: "Groceries",
    category: "Food",
    type: "expense",
    amount: 75.5,
  },
];

const renderList = (props) =>
  render(
    <MemoryRouter>
      <TransactionList {...props} />
    </MemoryRouter>,
  );

describe("TransactionList", () => {
  it("shows an empty state when there are no transactions", () => {
    renderList({ transactions: [], onDelete: vi.fn() });

    expect(
      screen.getByText("No transactions match this view."),
    ).toBeInTheDocument();
  });

  it("renders one row per transaction", () => {
    renderList({ transactions, onDelete: vi.fn() });

    expect(screen.getAllByText("Salary")).toHaveLength(2);
    expect(screen.getByText("Groceries")).toBeInTheDocument();
  });

  it("calls onDelete with the correct id when Delete is clicked", () => {
    const onDelete = vi.fn();

    renderList({ transactions, onDelete });

    fireEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]);

    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("disables delete buttons while a delete is pending", () => {
    renderList({ transactions, onDelete: vi.fn(), deleting: true });

    expect(
      screen.getAllByRole("button", { name: /delete/i }).every((button) => button.disabled),
    ).toBe(true);
  });
});
