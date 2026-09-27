// src/components/AddCategoryForm.jsx
import { useState } from "react";
import { API_BASE } from "../App";
import * as yup from "yup";
import styles from "./AddCategoryForm.module.css";

const EMPTY_FORM = {
  name: "",
  type: "expense",
  icon: "💰",
};

const CATEGORY_ICONS = [
  // Money & income
  { icon: "💰", label: "Money" },
  { icon: "💵", label: "Salary" },
  { icon: "💳", label: "Credit Card" },
  { icon: "🏦", label: "Bank" },
  { icon: "📈", label: "Investment" },
  { icon: "💼", label: "Work" },
  { icon: "🪙", label: "Savings" },
  { icon: "🎁", label: "Gift" },

  // Food & groceries
  { icon: "🍴", label: "Dining" },
  { icon: "🍚", label: "Food" },
  { icon: "☕", label: "Coffee" },
  { icon: "🍔", label: "Fast Food" },
  { icon: "🛒", label: "Groceries" },
  { icon: "🥦", label: "Fresh Food" },

  // Transport
  { icon: "🚗", label: "Car" },
  { icon: "🚌", label: "Bus" },
  { icon: "🚇", label: "Train" },
  { icon: "🚕", label: "Taxi" },
  { icon: "⛽", label: "Fuel" },
  { icon: "🚲", label: "Cycling" },

  // Home & utilities
  { icon: "🏠", label: "Housing" },
  { icon: "🏢", label: "Rent" },
  { icon: "⚡", label: "Electricity" },
  { icon: "💧", label: "Water" },
  { icon: "🔥", label: "Gas" },
  { icon: "📱", label: "Mobile" },
  { icon: "💻", label: "Internet" },
  { icon: "🔧", label: "Home Maintenance" },

  // Shopping & personal
  { icon: "🛍️", label: "Shopping" },
  { icon: "👕", label: "Clothing" },
  { icon: "👟", label: "Shoes" },
  { icon: "💇", label: "Personal Care" },
  { icon: "💄", label: "Beauty" },
  { icon: "📦", label: "Online Shopping" },

  // Health & protection
  { icon: "🏥", label: "Healthcare" },
  { icon: "💊", label: "Medicine" },
  { icon: "🦷", label: "Dental" },
  { icon: "🛡️", label: "Insurance" },

  // Entertainment & leisure
  { icon: "🎮", label: "Gaming" },
  { icon: "🎬", label: "Movies" },
  { icon: "🎵", label: "Music" },
  { icon: "📚", label: "Books" },
  { icon: "🏋️", label: "Fitness" },

  // Travel & education
  { icon: "✈️", label: "Travel" },
  { icon: "🏨", label: "Hotel" },
  { icon: "🎓", label: "Education" },
  { icon: "📝", label: "Courses" },

  // Miscellaneous
  { icon: "🐾", label: "Pets" },
];

const categorySchema = yup.object().shape({
  name: yup.string().trim().required("Category name is required."),
  type: yup.string().required("Category type is required"),
  icon: yup.string().required("Category icon is required."),
});

function AddCategoryForm({ onSuccess }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await categorySchema.validate(formData, { abortEarly: false });
    } catch (err) {
      const fieldErrors = {};
      err.inner.forEach((validationError) => {
        fieldErrors[validationError.path] = validationError.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to save category");

      const savedCategory = await res.json();
      setErrors({});
      setFormData(EMPTY_FORM);
      onSuccess(savedCategory);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;

    try {
      await categorySchema.validateAt(name, {
        ...formData,
        [name]: value,
      });
      setErrors((prev) => ({ ...prev, [name]: "" }));
    } catch (err) {
      setErrors((prev) => ({ ...prev, [name]: err.message }));
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.intro}>
        <h2>Create a new category</h2>
        <p>Add a category to better organize your transactions.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="name">Category name</label>

          <div
            className={`${styles.inputShell} ${
              errors.name ? styles.inputError : ""
            }`}
          >
            <span className={styles.leadingIcon} aria-hidden="true">
              ◇
            </span>

            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={submitting}
              placeholder="e.g. Groceries, Freelance, Rent..."
            />
          </div>

          {errors.name && <p className={styles.fieldError}>{errors.name}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="type">Type</label>

          <div className={styles.inputShell}>
            <span className={styles.leadingIcon} aria-hidden="true">
              ≡
            </span>

            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={submitting}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {errors.type && <p className={styles.fieldError}>{errors.type}</p>}
        </div>

        <div className={styles.iconGrid}>
          {CATEGORY_ICONS.map(({ icon, label }) => (
            <button
              key={label}
              type="button"
              className={`${styles.iconOption} ${
                formData.icon === icon ? styles.selectedIcon : ""
              }`}
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  icon,
                }))
              }
              title={label}
              aria-label={`Select ${label} icon`}
              aria-pressed={formData.icon === icon}
              disabled={submitting}
            >
              {icon}
            </button>
          ))}
        </div>

        <div className={styles.iconPickerHeader}>
          <span>Icon</span>
          <span className={styles.selectedIconPreview}>{formData.icon}</span>
        </div>

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={submitting}
          >
            <span className={styles.plusIcon} aria-hidden="true">
              +
            </span>
            {submitting ? "Saving..." : "Save Category"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default AddCategoryForm;
