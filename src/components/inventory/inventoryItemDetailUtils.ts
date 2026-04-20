import type { ListItemPurchaseRow, PurchaseHistoryEntry, PriceTrend } from "./inventoryItemDetailTypes";

export const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 2,
});

function asSingle<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function toNumberPrice(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function tripSortTime(row: PurchaseHistoryEntry): number {
  return new Date(row.tripDateIso).getTime();
}

export function normalizeRows(raw: ListItemPurchaseRow[], familyId: string): PurchaseHistoryEntry[] {
  const out: PurchaseHistoryEntry[] = [];
  for (const row of raw) {
    const trip = asSingle(row.shopping_lists);
    if (!trip || trip.family_id !== familyId) continue;

    const purchaser = asSingle(row.purchaser);
    const name =
      purchaser?.full_name?.trim() ||
      (row.purchased_by ? `สมาชิก (${row.purchased_by.slice(0, 8)}…)` : "ไม่ระบุ");

    out.push({
      id: row.id,
      listId: row.list_id,
      price: toNumberPrice(row.purchased_price),
      tripTitle: trip.title,
      tripDateIso: trip.created_at,
      lineCreatedAtIso: row.created_at,
      purchaserId: row.purchased_by,
      purchaserName: name,
      purchaserAvatarUrl: purchaser?.avatar_url ?? null,
    });
  }

  out.sort((a, b) => {
    const dt = tripSortTime(b) - tripSortTime(a);
    if (dt !== 0) return dt;
    return b.lineCreatedAtIso.localeCompare(a.lineCreatedAtIso);
  });

  return out;
}

export function initialsFromName(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  const a = parts[0]![0] ?? "";
  const b = parts[parts.length - 1]![0] ?? "";
  return (a + b).toUpperCase();
}

export function computePriceAnalytics(sortedHistory: PurchaseHistoryEntry[]) {
  const pricedChronologyNewestFirst = sortedHistory.filter((h) => h.price != null) as (PurchaseHistoryEntry & {
    price: number;
  })[];

  if (pricedChronologyNewestFirst.length === 0) {
    return {
      latest: null as number | null,
      lowest: null as number | null,
      highest: null as number | null,
      average: null as number | null,
      trend: null as PriceTrend | null,
      purchaseCountWithPrice: 0,
    };
  }

  const prices = pricedChronologyNewestFirst.map((h) => h.price);
  const latest = prices[0]!;
  const previous = prices[1];
  let trend: PriceTrend | null = null;
  if (previous != null) {
    if (latest > previous) trend = "UP";
    else if (latest < previous) trend = "DOWN";
    else trend = "UNCHANGED";
  }

  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  const average = prices.reduce((s, p) => s + p, 0) / prices.length;

  return {
    latest,
    lowest,
    highest,
    average,
    trend,
    purchaseCountWithPrice: prices.length,
  };
}

export function formatTripDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
