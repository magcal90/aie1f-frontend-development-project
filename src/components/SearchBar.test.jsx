import { render, screen, fireEvent } from "@testing-library/react";
import { TransactionContext } from "../contexts/TransactionContext";
import SearchBar from "./SearchBar";

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
    ...overrides,
  };

  return render(
    <TransactionContext.Provider value={value}>
      <SearchBar />
    </TransactionContext.Provider>
  );
}

describe("SearchBar", () => {
  it("renders the search input and filter controls", () => {
    renderSearchBar();

    expect(screen.getByPlaceholderText("Search transactions...")).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(4);
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
});