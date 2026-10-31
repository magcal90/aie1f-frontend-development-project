import { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Check, Plus, Sparkles, Trash2 } from "lucide-react";

import { TransactionContext } from "../contexts/TransactionContext";
import { reconcileReceiptItems } from "../utils/receiptItems";
import PageHeader from "../components/PageHeader";
import styles from "./NewTransaction.module.css";

// en-CA formats as YYYY-MM-DD in local time, matching the <input type="date"> value
const today = () => new Date().toLocaleDateString("en-CA");
const MAX_RECEIPT_SIZE = 4 * 1024 * 1024;

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });

function NewTransaction() {
  const { addTransaction, addTransactions, submitting, categories } =
    useContext(TransactionContext);
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(today);
  const [error, setError] = useState(null);
  const [receiptError, setReceiptError] = useState(null);
  const [receiptMessage, setReceiptMessage] = useState("");
  const [parsingReceipt, setParsingReceipt] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [receiptItems, setReceiptItems] = useState([]);
  const [splitReceipt, setSplitReceipt] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [savedLineIds, setSavedLineIds] = useState([]);
  const [uncertainSave, setUncertainSave] = useState(false);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [categorizationError, setCategorizationError] = useState(null);
  const [categorizationMessage, setCategorizationMessage] = useState("");
  const categorizationRequest = useRef(null);

  useEffect(() => () => categorizationRequest.current?.abort(), []);

  const expenseCategories = categories.filter((category) => category.type === "expense");
  const reconciliation = reconcileReceiptItems(receiptItems, amount);
  const receiptLocked = savedLineIds.length > 0 || uncertainSave;
  const busy = submitting || parsingReceipt || savingReceipt || categorizing;
  const money = (value) => Number.isFinite(value) ? value.toFixed(2) : "Not found";

  const updateReceiptItem = (id, updates) => {
    setReviewed(false);
    setReceiptItems((items) => items.map((item) => {
      if (item.id !== id) return item;
      if (Object.hasOwn(updates, "description")) {
        return {
          ...item, ...updates, suggestion: null,
          categoryId: item.categorySource?.startsWith("jev") ? "" : item.categoryId,
          categorySource: item.categorySource?.startsWith("jev") ? null : item.categorySource,
        };
      }
      return { ...item, ...updates, categorySource: Object.hasOwn(updates, "categoryId") ? "manual" : item.categorySource };
    }));
  };

  const updateMerchant = (value) => {
    setDescription(value);
    setReviewed(false);
    setCategorizationMessage("");
    setReceiptItems((items) => items.map((item) => ({
      ...item, suggestion: null,
      categoryId: item.categorySource?.startsWith("jev") ? "" : item.categoryId,
      categorySource: item.categorySource?.startsWith("jev") ? null : item.categorySource,
    })));
  };

  const handleCategorize = async () => {
    if (busy || receiptLocked || categorizationRequest.current) return;
    const controller = new AbortController();
    categorizationRequest.current = controller;
    setCategorizing(true);
    setCategorizationError(null);
    setCategorizationMessage("");
    setReviewed(false);
    const requestedItems = receiptItems.map((item) => ({ id: item.id, description: item.description }));
    try {
      const response = await fetch("/api/receipt/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: description,
          items: requestedItems,
          categories: expenseCategories.map((category) => ({
            id: category.id, name: category.name, type: category.type,
            ...(category.description ? { description: category.description } : {}),
          })),
        }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(25_000)]),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Category suggestions failed. Choose categories manually.");
      if (!Array.isArray(result.suggestions) || result.suggestions.length !== requestedItems.length ||
          new Set(result.suggestions.map((suggestion) => suggestion.itemId)).size !== requestedItems.length ||
          result.suggestions.some((suggestion) => !requestedItems.some((item) => item.id === suggestion.itemId) ||
            typeof suggestion.autoApply !== "boolean" ||
            ![suggestion.confidence, suggestion.probability].every((value) =>
              typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1) ||
            (suggestion.categoryId === null && suggestion.autoApply) ||
            (suggestion.categoryId !== null && !expenseCategories.some((category) => category.id === suggestion.categoryId)))) {
        throw new Error("Invalid category suggestions. Choose categories manually.");
      }
      if (controller.signal.aborted) return;
      setReceiptItems((items) => items.map((item) => {
        if (!requestedItems.some((requested) => requested.id === item.id && requested.description === item.description)) return item;
        const suggestion = result.suggestions.find((candidate) => candidate.itemId === item.id);
        const automatic = item.categorySource === "jev";
        const apply = suggestion.autoApply && (!item.categoryId || automatic);
        return {
          ...item,
          suggestion: { ...suggestion, model: result.model },
          categoryId: apply ? suggestion.categoryId : automatic ? "" : item.categoryId,
          categorySource: apply ? "jev" : automatic ? null : item.categorySource,
        };
      }));
      setCategorizationMessage("Category suggestions ready.");
    } catch (err) {
      if (!controller.signal.aborted) setCategorizationError(err.name === "TimeoutError"
        ? "Category suggestions timed out. Choose categories manually or try again."
        : err.message);
    } finally {
      if (categorizationRequest.current === controller) {
        categorizationRequest.current = null;
        setCategorizing(false);
      }
    }
  };

  const typeCategories = categories.filter((c) => c.type === type);
  const selectedCategoryId = typeCategories.some((c) => c.id === categoryId)
    ? categoryId
    : (typeCategories[0]?.id ?? "");

  const handleReceiptUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setReceiptError(null);
    setReceiptMessage("");
    setCategorizationError(null);
    setCategorizationMessage("");

    if (!file.type.startsWith("image/")) {
      setReceiptError("Choose an image file.");
      return;
    }
    if (file.size > MAX_RECEIPT_SIZE) {
      setReceiptError("The image must be 4 MB or smaller.");
      return;
    }

    setParsingReceipt(true);
    try {
      const fileData = await readFileAsDataUrl(file);
      const response = await fetch("/api/receipt/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileData, fileName: file.name }),
      });
      const receipt = await response.json();
      if (!response.ok) {
        throw new Error(receipt.error || "Receipt parsing failed.");
      }

      const items = Array.isArray(receipt.items) ? receipt.items : [];
      setReceipt({ ...receipt, id: crypto.randomUUID() });
      setReceiptItems(items.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
        description: item.description || "",
        amount: item.amount == null ? "" : String(item.amount),
        categoryId: "",
      })));
      setSplitReceipt(items.length > 0);
      setSavedLineIds([]);
      setUncertainSave(false);
      setReviewed(false);
      setError(null);
      if (items.length) {
        setDescription(receipt.merchant || "");
        setAmount(receipt.amount == null ? "" : String(receipt.amount));
      }

      let extractedFields = 0;
      if (receipt.merchant) {
        setDescription(receipt.merchant.slice(0, 100));
        extractedFields += 1;
      }
      if (Number.isFinite(receipt.amount) && receipt.amount > 0) {
        setAmount(String(receipt.amount));
        extractedFields += 1;
      }
      if (typeof receipt.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(receipt.date)) {
        setDate(receipt.date);
        extractedFields += 1;
      }

      if (!extractedFields && !items.length) {
        throw new Error("No merchant, total, or date was found in that receipt.");
      }
      setReceiptMessage("Receipt scanned. Review the details before saving.");
    } catch (err) {
      setReceiptError(err.message || "Receipt parsing failed.");
    } finally {
      setParsingReceipt(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (busy || uncertainSave) return;

    setError(null);

    const trimmed = description.trim();
    const numericAmount = Number(amount);

    if (!date) {
      setError("Please choose a date.");
      return;
    }
    if (splitReceipt) {
      if (reconciliation.error) {
        setError(reconciliation.error);
        return;
      }
      if (receiptItems.some((item) => !item.description.trim() ||
          !expenseCategories.some((category) => category.id === item.categoryId))) {
        setError("Enter a description and choose an expense category for every purchase.");
        return;
      }
      if (!reviewed) {
        setError("Confirm the purchases and receipt total before saving.");
        return;
      }
      setSavingReceipt(true);
      try {
        const drafts = receiptItems.map((item, index) => ({
          date,
          description: item.description.trim(),
          categoryId: item.categoryId,
          amount: reconciliation.amounts[index],
          receiptId: receipt.id,
          receiptLineId: item.id,
          merchant: trimmed,
          receiptCurrency: receipt.currency,
          receiptTotal: Number(amount),
          receiptSubtotal: receipt.subtotal,
          receiptTax: receipt.tax,
          receiptDiscount: receipt.discount,
          receiptAdjustmentPolicy: "proportional-net",
          receiptLineAmount: Number(item.amount),
          receiptLineAdjustment: Number((reconciliation.amounts[index] - Number(item.amount)).toFixed(2)),
          quantity: item.quantity ?? null,
          unitPrice: item.unitPrice ?? null,
          receiptLineTax: item.tax ?? null,
          receiptLineDiscount: item.discount ?? null,
          receiptCategorySource: item.categorySource || "manual",
          receiptCategorySuggestion: item.suggestion ? {
            model: item.suggestion.model,
            categoryId: item.suggestion.categoryId,
            confidence: item.suggestion.confidence,
            probability: item.suggestion.probability,
          } : null,
        })).filter((item) => !savedLineIds.includes(item.receiptLineId));
        const result = await addTransactions(drafts);
        setSavedLineIds((ids) => [...ids, ...result.saved.map((item) => item.receiptLineId)]);
        if (result.error) {
          setUncertainSave(Boolean(result.uncertain));
          setError(result.uncertain
            ? "Save status could not be verified. Check Transactions before importing this receipt again."
            : `${result.error}. Confirmed purchases remain saved; retry saves only the remaining purchases.`);
        } else {
          navigate("/app/transactions");
        }
      } catch (err) {
        setUncertainSave(true);
        setError(`Save status is uncertain: ${err.message}. Check Transactions before importing again.`);
      } finally {
        setSavingReceipt(false);
      }
      return;
    }
    if (!trimmed) {
      setError("Please enter a description.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }
    if (!selectedCategoryId) {
      setError("Please choose a category.");
      return;
    }

    // Start saving; the context handles success or rollback.
    void addTransaction({
      date,
      description: trimmed,
      categoryId: selectedCategoryId,
      amount: numericAmount,
    });

    navigate("/app/transactions");
  };

  return (
    <main className={styles.page}>
      <PageHeader
        eyebrow="Money movement"
        title="New Transaction"
        subtitle="Record a new income or expense."
      />

      <section className={styles.card} aria-label="New transaction form">
        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.receiptField}>
            <label className={styles.label} htmlFor="receipt-image">
              Receipt image
            </label>
            <input
              id="receipt-image"
              className={styles.input}
              type="file"
              accept="image/*"
              onChange={handleReceiptUpload}
              disabled={busy || receiptLocked}
            />
            {parsingReceipt && <p role="status">Scanning receipt…</p>}
            {receiptMessage && <p role="status">{receiptMessage}</p>}
            {receiptError && (
              <p className={styles.receiptError} role="alert">
                {receiptError}
              </p>
            )}
          </div>

          <div className={styles.grid}>
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label className={styles.label} htmlFor="description">
                {splitReceipt ? "Merchant" : "Description"}
              </label>
              <input
                id="description"
                type="text"
                className={styles.input}
                value={description}
                onChange={(e) => updateMerchant(e.target.value)}
                disabled={busy || receiptLocked}
                placeholder="e.g. NTUC FairPrice"
                maxLength={100}
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="amount">
                {splitReceipt ? "Receipt total" : "Amount"}
              </label>
              <input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                className={styles.input}
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setReviewed(false); }}
                disabled={busy || receiptLocked}
                placeholder="0.00"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="date">
                Date
              </label>
              <input
                id="date"
                type="date"
                className={styles.input}
                value={date}
                onChange={(e) => { setDate(e.target.value); setReviewed(false); }}
                disabled={busy || receiptLocked}
                required
              />
            </div>

            {!splitReceipt && <div className={styles.field}>
              <label className={styles.label} htmlFor="type">
                Type
              </label>
              <select
                id="type"
                className={styles.input}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>}

            {!splitReceipt && <div className={styles.field}>
              <label className={styles.label} htmlFor="category">
                Category
              </label>
              <select
                id="category"
                className={styles.input}
                value={selectedCategoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {typeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>}
          </div>

          {receipt && <div className={styles.receiptReview}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={splitReceipt} disabled={busy || receiptLocked}
                onChange={(event) => { setSplitReceipt(event.target.checked); setReviewed(false); }} />
              Save individual purchases
            </label>
            {splitReceipt && <>
              <div className={styles.itemsToolbar}>
                <h2 className={styles.itemsHeading}>Purchases{receipt.currency ? ` (${receipt.currency})` : ""}</h2>
                <button type="button" className={styles.suggestButton} title="Suggest categories using Jev"
                  disabled={busy || receiptLocked || !receiptItems.length || !expenseCategories.length ||
                    receiptItems.some((item) => !item.description.trim())}
                  onClick={handleCategorize}>
                  <Sparkles size={18} />{categorizing ? "Suggesting..." : "Suggest Categories"}
                </button>
              </div>
              {categorizing && <p className={styles.itemMeta} role="status">Getting category suggestions...</p>}
              {categorizationMessage && <p className={styles.itemMeta} role="status">{categorizationMessage}</p>}
              {categorizationError && <p className={styles.receiptError} role="alert">{categorizationError}</p>}
              <div className={styles.itemsList}>
                {receiptItems.map((item, index) => <div key={item.id} className={styles.itemRow}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`item-description-${item.id}`}>Purchase {index + 1}</label>
                    <input id={`item-description-${item.id}`} className={styles.input} value={item.description}
                      maxLength={100} disabled={busy || receiptLocked}
                      onChange={(event) => updateReceiptItem(item.id, { description: event.target.value })} />
                    {(item.quantity != null || item.unitPrice != null) && <p className={styles.itemMeta}>
                      Quantity: {item.quantity ?? "Not found"} · Unit price: {money(item.unitPrice)}
                    </p>}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`item-amount-${item.id}`}>Line total</label>
                    <input id={`item-amount-${item.id}`} className={styles.input} type="number" min="0" step="0.01"
                      value={item.amount} disabled={busy || receiptLocked}
                      onChange={(event) => updateReceiptItem(item.id, { amount: event.target.value })} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`item-category-${item.id}`}>Category</label>
                    <select id={`item-category-${item.id}`} className={styles.input} value={item.categoryId}
                      disabled={busy || receiptLocked}
                      onChange={(event) => updateReceiptItem(item.id, { categoryId: event.target.value })}>
                      <option value="">Choose category</option>
                      {expenseCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                  </div>
                  <button type="button" className={styles.iconButton} title={`Remove purchase ${index + 1}`}
                    aria-label={`Remove purchase ${index + 1}`} disabled={busy || receiptLocked}
                    onClick={() => { setReceiptItems((items) => items.filter((candidate) => candidate.id !== item.id)); setReviewed(false); }}>
                    <Trash2 size={18} />
                  </button>
                  <p className={styles.allocatedAmount}>
                    {savedLineIds.includes(item.id) ? "Saved" : "Allocated total"}: {money(reconciliation.amounts?.[index])}
                  </p>
                  {item.suggestion && <div className={styles.categorySuggestion}>
                    <span>
                      Jev: {expenseCategories.find((category) => category.id === item.suggestion.categoryId)?.name || "Unclassified"}
                      {`. Confidence ${Math.round(item.suggestion.confidence * 100)}%; choice probability ${Math.round(item.suggestion.probability * 100)}%.`}
                      {!item.suggestion.autoApply && " Needs review."}
                    </span>
                    {item.suggestion.categoryId && item.categoryId !== item.suggestion.categoryId &&
                      <button type="button" className={styles.iconButton} title={`Use Jev suggestion for purchase ${index + 1}`}
                        aria-label={`Use Jev suggestion for purchase ${index + 1}`} disabled={busy || receiptLocked}
                        onClick={() => {
                          setReviewed(false);
                          setReceiptItems((items) => items.map((candidate) => candidate.id === item.id
                            ? { ...candidate, categoryId: item.suggestion.categoryId, categorySource: "jev-reviewed" }
                            : candidate));
                        }}><Check size={18} /></button>}
                  </div>}
                </div>)}
              </div>
              <button type="button" className={styles.iconButton} title="Add purchase" aria-label="Add purchase"
                disabled={busy || receiptLocked} onClick={() => {
                  setReceiptItems((items) => [...items, { id: crypto.randomUUID(), description: "", amount: "", categoryId: "" }]);
                  setReviewed(false);
                }}><Plus size={18} /></button>
              <dl className={styles.receiptSummary}>
                <div><dt>Printed subtotal</dt><dd>{money(receipt.subtotal)}</dd></div>
                <div><dt>Printed tax</dt><dd>{money(receipt.tax)}</dd></div>
                <div><dt>Printed discount</dt><dd>{money(receipt.discount)}</dd></div>
                <div><dt>Reviewed item total</dt><dd>{money(reconciliation.itemTotal)}</dd></div>
                <div><dt>Net adjustment</dt><dd>{money(reconciliation.adjustment)}</dd></div>
                <div><dt>Receipt total</dt><dd>{money(Number(amount))}</dd></div>
              </dl>
              {reconciliation.error && <p className={styles.receiptError} role="alert">{reconciliation.error}</p>}
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={reviewed} disabled={busy || receiptLocked || Boolean(reconciliation.error)}
                  onChange={(event) => setReviewed(event.target.checked)} />
                {reconciliation.adjustment
                  ? `I verified all purchases and approve allocating the ${money(reconciliation.adjustment)} net adjustment proportionally.`
                  : "I verified all purchases and the receipt total."}
              </label>
              {savedLineIds.length > 0 && <p role="status">{savedLineIds.length} purchases saved.</p>}
            </>}
          </div>}

          <div className={styles.actions}>
            <Link to="/app/transactions" className={styles.cancelButton}>
              Cancel
            </Link>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={busy || uncertainSave || (splitReceipt && (!reviewed || Boolean(reconciliation.error)))}
            >
              {submitting || savingReceipt
                ? "Saving…"
                : parsingReceipt
                  ? "Scanning receipt…"
                  : splitReceipt ? (savedLineIds.length ? "Retry Remaining Purchases" : "Save Purchases") : "Save Transaction"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default NewTransaction;
