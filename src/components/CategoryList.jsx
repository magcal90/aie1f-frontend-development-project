import { memo } from "react";
import { Trash2 } from "lucide-react";
import styles from "../pages/CategoriesPage.module.css";

function CategoryList({ categories, assignedCategoryIds, onDelete }) {
  if (categories.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⌕</div>
        <h2>No categories found</h2>
        <p>Try a different search term or create a new category.</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {categories.map((category) => {
        const canDelete = !assignedCategoryIds.has(category.id); // not assigned Category can be deleted.

        return (
          <article className={styles.card} key={category.id}>
            <div
              className={`${styles.categoryIcon} ${
                category.type === "income"
                  ? styles.incomeIcon
                  : styles.expenseIcon
              }`}
              aria-hidden="true"
            >
              {category.icon || "💰"}
            </div>

            <div className={styles.cardContent}>
              <h2>{category.name}</h2>

              <span
                className={`${styles.typeBadge} ${
                  category.type === "income" ? styles.income : styles.expense
                }`}
              >
                {category.type}
              </span>
            </div>

            <button
              className={styles.menuButton}
              type="button"
              aria-label={
                canDelete
                  ? `Delete ${category.name}`
                  : `${category.name} cannot be deleted because it is assigned to transactions`
              }
              title={
                canDelete
                  ? `Delete ${category.name}`
                  : "Cannot delete: this category is assigned to transactions"
              }
              disabled={!canDelete}
              onClick={() => onDelete(category.id)}
            >
              <Trash2 className={styles.deleteIcon} aria-hidden="true" />
            </button>
          </article>
        );
      })}
    </div>
  );
}

export default memo(CategoryList);
