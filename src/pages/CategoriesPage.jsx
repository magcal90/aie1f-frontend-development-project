// src/pages/CategoriesPage.jsx
import { useState, useMemo, useCallback, useContext } from "react";
import { TransactionContext } from "../contexts/TransactionContext";
import CategorySearchBar from "../components/CategorySearchBar";
import CategoryList from "../components/CategoryList";
import AddCategoryForm from "../components/AddCategoryForm";
import Spinner from "../components/Spinner";
import styles from "./CategoriesPage.module.css";
import { API_BASE } from "../App";

function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [addedCategories, setAddedCategories] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const { categories, transactions, loading, error } =
    useContext(TransactionContext);
  const [deletedCategoryIds, setDeletedCategoryIds] = useState(() => new Set());

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
  }, []);

  const filteredCategories = useMemo(() => {
    return [...categories, ...addedCategories].filter(
      (category) =>
        !deletedCategoryIds.has(category.id) &&
        category.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [categories, addedCategories, search]);

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
    setAddedCategories((current) => [...current, category]);
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

      setDeletedCategoryIds((current) => new Set([...current, categoryId]));
      setAddedCategories((current) =>
        current.filter((category) => category.id !== categoryId),
      );
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div>
            <h1>Category List</h1>
            <p className={styles.subtitle}>
              Organize your income and expenses with custom categories.
            </p>
          </div>
        </div>

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
      </div>

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
