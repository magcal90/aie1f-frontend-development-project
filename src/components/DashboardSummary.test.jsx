import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import DashboardSummary from "./DashboardSummary";

it("shows income, expenses, and net balance totals", () => {
  render(
    <DashboardSummary
      transactions={[
        { type: "income", amount: 1000 },
        { type: "expense", amount: 250 },
      ]}
    />,
  );

  expect(screen.getByText("Net balance").nextElementSibling).toHaveTextContent(
    "750.00",
  );
  expect(screen.getByText("Total income").nextElementSibling).toHaveTextContent(
    "1,000.00",
  );
  expect(
    screen.getByText("Total expenses").nextElementSibling,
  ).toHaveTextContent("250.00");
});

it("shows zero totals when no transactions are provided", () => {
  render(<DashboardSummary />);

  expect(screen.getByText("Net balance").nextElementSibling).toHaveTextContent(
    "0.00",
  );
  expect(screen.getByText("Total income").nextElementSibling).toHaveTextContent(
    "0.00",
  );
  expect(
    screen.getByText("Total expenses").nextElementSibling,
  ).toHaveTextContent("0.00");
});

it("treats an invalid amount as zero", () => {
  render(
    <DashboardSummary
      transactions={[{ type: "income", amount: "not a number" }]}
    />,
  );

  expect(screen.getByText("Total income").nextElementSibling).toHaveTextContent(
    "0.00",
  );
});