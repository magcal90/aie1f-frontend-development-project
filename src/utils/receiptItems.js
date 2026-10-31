export function toCents(value) {
  if (value == null || String(value).trim() === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const cents = Math.round(number * 100);
  if (!Number.isSafeInteger(cents) || Math.abs(number * 100 - cents) > 0.000001) return null;
  return cents;
}

export function reconcileReceiptItems(items, total) {
  const totalCents = toCents(total);
  const amounts = items.map((item) => toCents(item.amount));
  if (!items.length || totalCents == null || totalCents <= 0 ||
      amounts.some((amount) => amount == null || amount < 0)) {
    return { error: "Enter a positive receipt total and non-negative item totals with at most two decimal places." };
  }
  const itemTotal = amounts.reduce((sum, amount) => sum + amount, 0);
  if (!Number.isSafeInteger(itemTotal) || itemTotal <= 0 ||
      amounts.some((amount) => !Number.isSafeInteger(amount * totalCents))) {
    return { error: "The item totals must be positive overall and within the supported money range." };
  }
  const shares = amounts.map((amount, index) => ({
    index,
    cents: Math.floor(amount * totalCents / itemTotal),
    remainder: amount * totalCents % itemTotal,
  }));
  const remaining = totalCents - shares.reduce((sum, share) => sum + share.cents, 0);
  const ranked = [...shares].sort((left, right) => right.remainder - left.remainder || left.index - right.index);
  ranked.slice(0, remaining).forEach((share) => { share.cents += 1; });
  return {
    itemTotal: itemTotal / 100,
    adjustment: (totalCents - itemTotal) / 100,
    amounts: shares.map((share) => share.cents / 100),
  };
}