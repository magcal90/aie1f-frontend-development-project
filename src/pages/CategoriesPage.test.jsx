import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { TransactionContext } from "../contexts/TransactionContext";
import CategoriesPage from "./CategoriesPage";
import { useState } from "react";

vi.mock("../App", () => ({
  API_BASE: "https://6aba3f3b5b549d818d6234a4.mockapi.io/api/v1",
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

const categories = [
  { id: "salary", name: "Salary", type: "income" },
  { id: "food", name: "Food", type: "expense" },
  { id: "transport", name: "Transport", type: "expense" },
];

function TestProvider({ valueOverrides }) {
  const [cats, setCats] = useState(valueOverrides.categories ?? categories);
  const value = {
    transactions: [],
    loading: false,
    error: null,
    ...valueOverrides,
    categories: cats,
    addCategory: (c) => setCats((prev) => [...prev, c]),
    removeCategory: (id) => setCats((prev) => prev.filter((c) => c.id !== id)),
  };
  return (
    <TransactionContext.Provider value={value}>
      <CategoriesPage />
    </TransactionContext.Provider>
  );
}

function renderCategoriesPage(valueOverrides = {}) {
  return render(<TestProvider valueOverrides={valueOverrides} />);
}

describe("CategoriesPage", () => {
  it("renders categories from context", () => {
    renderCategoriesPage();

    expect(
      screen.getByRole("heading", { name: "Category List" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Transport")).toBeInTheDocument();
    expect(screen.getByText("income")).toBeInTheDocument();
    expect(screen.getAllByText("expense")).toHaveLength(2);
  });

  it("filters categories by search text", () => {
    renderCategoriesPage();

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search categories by name" }),
      { target: { value: "food" } },
    );

    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.queryByText("Salary")).not.toBeInTheDocument();
    expect(screen.queryByText("Transport")).not.toBeInTheDocument();
    expect(screen.getByText(/Showing/i)).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("adds a category from the embedded form", async () => {
    const savedCategory = { id: "travel", name: "Travel", type: "expense" };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => savedCategory,
    });
    vi.stubGlobal("fetch", fetchMock);

    renderCategoriesPage();
    fireEvent.click(screen.getByRole("button", { name: "Add Category" }));
    fireEvent.change(screen.getByLabelText("Category name"), {
      target: { value: "Travel" },
    });
    fireEvent.change(screen.getByLabelText("Type"), {
      target: { value: "expense" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Category" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "https://6aba3f3b5b549d818d6234a4.mockapi.io/api/v1/categories",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(await screen.findByText("Travel")).toBeInTheDocument();
  });
});
