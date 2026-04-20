export type ItemTemplate = {
  id: string;
  family_id: string;
  name: string;
  category: string | null;
};

export type ShoppingListItemRow = {
  id: string;
  list_id: string;
  item_id: string;
  is_bought: boolean | null;
  purchased_price: number | null;
  purchased_by: string | null;
  created_at: string;
  item: {
    id: string;
    name: string;
    category: string | null;
  } | null;
};

export const SHOPPING_TEMPLATE_PAGE_SIZE = 4;

export type ShoppingListMeta = {
  id: string;
  family_id: string;
  title: string;
  is_completed: boolean | null;
  created_at: string;
};
