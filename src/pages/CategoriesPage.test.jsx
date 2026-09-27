import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { TransactionContext } from "../contexts/TransactionContext";
import CategoriesPage from "./CategoriesPage";

afterEach(() => {
  vi.unstubAllGlobals();
});

const categories = [
  { id: "salary", name: "Salary", type: "income" },
  { id: "food", name: "Food", type: "expense" },
  { id: "transport", name: "Transport", type: "expense" },
];

function renderCategoriesPage(valueOverrides = {}) {
  const value = {
    categories,
    ...valueOverrides,
  };

  return render(
    <TransactionContext.Provider value={value}>
      <CategoriesPage />
    </TransactionContext.Provider>,
  );
}

describe("CategoriesPage", () => {
  it("renders categories from context", () => {
    renderCategoriesPage();

    expect(screen.getByRole("heading", { name: "Categories" })).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Transport")).toBeInTheDocument();
    expect(screen.getByText("income")).toBeInTheDocument();
    expect(screen.getAllByText("expense")).toHaveLength(2);
  });

  it("filters categories by search text", () => {
    renderCategoriesPage();

    fireEvent.change(screen.getByLabelText(/search by name/i), {
      target: { value: "food" },
    });

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
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Travel" },
    });
    fireEvent.change(screen.getByLabelText("Type"), {
      target: { value: "expense" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Category" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/categories",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(await screen.findByText("Travel")).toBeInTheDocument();
  });
});