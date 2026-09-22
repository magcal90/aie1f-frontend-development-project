import { render, screen, fireEvent } from "@testing-library/react";
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

describe("TransactionList", () => {
  it("shows an empty state when there are no transactions", () => {
    render(<TransactionList transactions={[]} onDelete={vi.fn()} />);

    expect(screen.getByText("No transactions match this view.")).toBeInTheDocument();
  });

  it("renders one row per transaction", () => {
    render(<TransactionList transactions={transactions} onDelete={vi.fn()} />);

    expect(screen.getAllByText("Salary")).toHaveLength(2);
    expect(screen.getByText("Groceries")).toBeInTheDocument();
  });

  it("calls onDelete with the correct id when Delete is clicked", () => {
    const onDelete = vi.fn();

    render(<TransactionList transactions={transactions} onDelete={onDelete} />);

    fireEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]);

    expect(onDelete).toHaveBeenCalledWith(1);
  });
});