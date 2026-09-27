import { render, screen, fireEvent } from "@testing-library/react";
import { TransactionContext } from "../contexts/TransactionContext";
import SearchBar from "./SearchBar";

const categories = [
  { id: "salary", name: "Salary", type: "income" },
  { id: "food", name: "Food", type: "expense" },
];

function renderSearchBar(overrides = {}) {
  const value = {
    searchTerm: "",
    setSearchTerm: vi.fn(),
    typeFilter: "all",
    setTypeFilter: vi.fn(),
    categoryFilter: "all",
    setCategoryFilter: vi.fn(),
    monthFilter: "all",
    setMonthFilter: vi.fn(),
    sortBy: "date-desc",
    setSortBy: vi.fn(),
    categories,
    transactions: [],
    ...overrides,
  };

  return render(
    <TransactionContext.Provider value={value}>
      <SearchBar />
    </TransactionContext.Provider>,
  );
}

describe("SearchBar", () => {
  it("renders the search input and filter controls", () => {
    renderSearchBar();

    expect(screen.getByPlaceholderText("Search transactions...")).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(4);
    expect(screen.getByRole("option", { name: "Salary" })).toHaveValue("salary");
    expect(screen.getByRole("option", { name: "Food" })).toHaveValue("food");
  });

  it("updates the search term when the user types", () => {
    const setSearchTerm = vi.fn();

    renderSearchBar({ setSearchTerm });

    fireEvent.change(screen.getByPlaceholderText("Search transactions..."), {
      target: { value: "rent" },
    });

    expect(setSearchTerm).toHaveBeenCalledWith("rent");
  });

  it("updates the type filter when a user selects a value", () => {
    const setTypeFilter = vi.fn();

    renderSearchBar({ setTypeFilter });

    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "income" },
    });

    expect(setTypeFilter).toHaveBeenCalledWith("income");
  });

  it("updates the category filter using the category id", () => {
    const setCategoryFilter = vi.fn();

    renderSearchBar({ setCategoryFilter });

    fireEvent.change(screen.getAllByRole("combobox")[1], {
      target: { value: "food" },
    });

    expect(setCategoryFilter).toHaveBeenCalledWith("food");
  });

  it("lists unique months from all transactions in descending order", () => {
    const setMonthFilter = vi.fn();
    renderSearchBar({
      setMonthFilter,
      transactions: [
        { date: "2025-12-20" },
        { date: "2026-01-05" },
        { date: "2026-01-18" },
        { date: "2025-11-02" },
      ],
    });

    const monthSelect = screen.getByRole("combobox", { name: "Transaction month" });
    expect([...monthSelect.options].map(({ value, text }) => [value, text])).toEqual([
      ["all", "All Months"],
      ["2026-01", "Jan 2026"],
      ["2025-12", "Dec 2025"],
      ["2025-11", "Nov 2025"],
    ]);

    fireEvent.change(monthSelect, { target: { value: "2025-12" } });
    expect(setMonthFilter).toHaveBeenCalledWith("2025-12");
  });
});