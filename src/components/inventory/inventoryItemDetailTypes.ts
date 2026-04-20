export type InventoryItemDetail = {
  id: string;
  family_id: string;
  name: string;
  category: string | null;
  created_at: string;
};

export type ShoppingListEmbed = {
  id: string;
  title: string;
  created_at: string;
  family_id: string;
};

export type PurchaserEmbed = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

/** Row shape returned by Supabase nested select (aliases + relations). */
export type ListItemPurchaseRow = {
  id: string;
  list_id: string;
  purchased_price: number | string | null;
  purchased_by: string | null;
  created_at: string;
  shopping_lists: ShoppingListEmbed | ShoppingListEmbed[] | null;
  purchaser: PurchaserEmbed | PurchaserEmbed[] | null;
};

export type PurchaseHistoryEntry = {
  id: string;
  listId: string;
  price: number | null;
  tripTitle: string;
  tripDateIso: string;
  lineCreatedAtIso: string;
  purchaserId: string | null;
  purchaserName: string;
  purchaserAvatarUrl: string | null;
};

export type PriceTrend = "UP" | "DOWN" | "UNCHANGED";
