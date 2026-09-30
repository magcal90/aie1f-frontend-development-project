// src/pages/CategoriesPage.jsx
import { useState, useMemo, useCallback, useContext } from "react";
import { TransactionContext } from "../contexts/TransactionContext";
import PageHeader from "../components/PageHeader";
import CategorySearchBar from "../components/CategorySearchBar";
import CategoryList from "../components/CategoryList";
import AddCategoryForm from "../components/AddCategoryForm";
import Spinner from "../components/Spinner";
import styles from "./CategoriesPage.module.css";
import { API_BASE } from "../App";

function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const {
    categories,
    transactions,
    loading,
    error,
    addCategory,
    removeCategory,
  } = useContext(TransactionContext);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
  }, []);

  const filteredCategories = useMemo(
    () =>
      categories.filter((category) =>
        category.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [categories, search],
  );

  const assignedCategoryIds = useMemo(
    () => new Set(transactions.map((transaction) => transaction.categoryId)),
    [transactions],
  );

  if (loading) return <Spinner />;

  if (error) {
    return (
      <p className={styles.statusMessage}>Failed to load categories: {error}</p>
    );
  }

  const handleCategoryCreated = (category) => {
    addCategory(category);
    setShowAddForm(false);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (assignedCategoryIds.has(categoryId)) return;
    if (!window.confirm("Delete this category?")) return;

    try {
      const response = await fetch(`${API_BASE}/categories/${categoryId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete category");
      removeCategory(categoryId);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <main className={styles.page}>
      <PageHeader
        eyebrow="Organization"
        title="Category List"
        subtitle="Organize your income and expenses with custom categories."
        action={
          <button
            type="button"
            className={`${styles.addButton} ${
              showAddForm ? styles.cancelButton : ""
            }`}
            aria-expanded={showAddForm}
            onClick={() => setShowAddForm((visible) => !visible)}
          >
            {showAddForm ? (
              <>
                <span className={styles.buttonIcon} aria-hidden="true">
                  ×
                </span>
                Cancel
              </>
            ) : (
              <>
                <span className={styles.buttonIcon} aria-hidden="true">
                  +
                </span>
                Add Category
              </>
            )}
          </button>
        }
      />

      {showAddForm && <AddCategoryForm onSuccess={handleCategoryCreated} />}

      <div className={styles.toolbar}>
        <CategorySearchBar value={search} onChange={handleSearchChange} />

        <p className={styles.count}>
          Showing <strong>{filteredCategories.length}</strong> categories
        </p>
      </div>

      <CategoryList
        categories={filteredCategories}
        assignedCategoryIds={assignedCategoryIds}
        onDelete={handleDeleteCategory}
      />
    </main>
  );
}

export default CategoriesPage;
