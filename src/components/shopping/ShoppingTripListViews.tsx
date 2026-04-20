import { ScrollView, Text, View } from "react-native";
import { Button, ListGroup } from "heroui-native";
import { Check, CircleDashed, DollarSign, Plus, Trash2, Undo2 } from "lucide-react-native";
import type { ShoppingListItemRow } from "./shoppingTripTypes";

type ShoppingTripListViewsProps = {
  tripCompleted: boolean | undefined;
  errorMessage: string | null;
  onRetry: () => void;
  familyId: string | null;
  templatesCount: number;
  onOpenAddDialog: () => void;
  pendingItems: ShoppingListItemRow[];
  boughtItems: ShoppingListItemRow[];
  currentUserId: string | null;
  onCheckout: (item: ShoppingListItemRow) => void;
  onRemoveItem: (item: ShoppingListItemRow) => void;
  onMarkPending: (item: ShoppingListItemRow) => void;
  totalPrice: number;
};

export function ShoppingTripListViews({
  tripCompleted,
  errorMessage,
  onRetry,
  familyId,
  templatesCount,
  onOpenAddDialog,
  pendingItems,
  boughtItems,
  currentUserId,
  onCheckout,
  onRemoveItem,
  onMarkPending,
  totalPrice,
}: ShoppingTripListViewsProps) {
  return (
    <>
      <ScrollView className="flex-1 px-4 pt-4 pb-28">
        <View className="mb-4">
          <Text className="text-sm text-gray-600 dark:text-zinc-300 font-noto">
            {tripCompleted ? "สำเร็จ" : "กำลังดำเนินการ"}
          </Text>
        </View>

        {errorMessage ? (
          <View className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
            <Text className="text-sm text-red-700 dark:text-red-300 font-noto">{errorMessage}</Text>
            <Button variant="secondary" className="mt-3 rounded-full border border-red-300" onPress={onRetry}>
              <Text className="text-sm text-red-700 font-noto-bold">ลองใหม่</Text>
            </Button>
          </View>
        ) : null}

        <Button
          variant="primary"
          className="mb-4 rounded-full"
          onPress={onOpenAddDialog}
          isDisabled={!familyId || templatesCount === 0}
        >
          <View className="flex-row items-center justify-center">
            <Plus size={16} color="#fff" />
            <Text className="ml-2 text-sm text-white font-noto-bold">เพิ่มสินค้าเข้าไปในรายการซื้อของ</Text>
          </View>
        </Button>

        <View className="mb-4">
          <Text className="mb-2 text-base text-black dark:text-white font-noto-bold">รอซื้อ ({pendingItems.length})</Text>
          <ListGroup className="rounded-2xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 overflow-hidden">
            {pendingItems.length === 0 ? (
              <View className="items-center p-5">
                <CircleDashed color="#9ca3af" size={22} />
                <Text className="mt-2 text-sm text-gray-500 dark:text-zinc-400 font-noto">ยังไม่มีสินค้ารอซื้อ.</Text>
              </View>
            ) : (
              pendingItems.map((item) => (
                <ListGroup.Item key={item.id} onPress={() => onCheckout(item)}>
                  <ListGroup.ItemPrefix>
                    <CircleDashed color="#6b7280" size={18} />
                  </ListGroup.ItemPrefix>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle className="text-base text-black dark:text-white font-noto-bold">
                      {item.item?.name ?? "Unknown item"}
                    </ListGroup.ItemTitle>
                    <ListGroup.ItemDescription className="text-xs text-gray-500 dark:text-zinc-400 font-noto">
                      {item.item?.category || "ไม่ได้ระบุหมวดหมู่"} - แตะเพื่อตรวจสอบสินค้า
                    </ListGroup.ItemDescription>
                  </ListGroup.ItemContent>
                  <ListGroup.ItemSuffix>
                    <Button variant="secondary" className="h-9 w-9 min-w-0 rounded-full px-0" onPress={() => onRemoveItem(item)}>
                      <Trash2 color="#dc2626" size={18} />
                    </Button>
                  </ListGroup.ItemSuffix>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        </View>

        <View>
          <Text className="mb-2 text-base text-black dark:text-white font-noto-bold">ซื้อแล้ว ({boughtItems.length})</Text>
          <ListGroup className="rounded-2xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 overflow-hidden">
            {boughtItems.length === 0 ? (
              <View className="items-center p-5">
                <Check color="#9ca3af" size={22} />
                <Text className="mt-2 text-sm text-gray-500 dark:text-zinc-400 font-noto">ยังไม่มีสินค้าที่ซื้อแล้ว.</Text>
              </View>
            ) : (
              boughtItems.map((item) => (
                <ListGroup.Item key={item.id}>
                  <ListGroup.ItemPrefix>
                    <Check color="#16a34a" size={18} />
                  </ListGroup.ItemPrefix>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle className="text-base text-black dark:text-white font-noto-bold">
                      {item.item?.name ?? "Unknown item"}
                    </ListGroup.ItemTitle>
                    <ListGroup.ItemDescription className="text-xs text-gray-500 dark:text-zinc-400 font-noto">
                      {item.purchased_price ? `ราคาสินค้า: ${item.purchased_price}` : "ไม่ระบุราคา"} - จ่ายโดย
                      {item.purchased_by ? (item.purchased_by === currentUserId ? "คุณ" : "สมาชิกครอบครัว") : "-"}
                    </ListGroup.ItemDescription>
                  </ListGroup.ItemContent>
                  <ListGroup.ItemSuffix>
                    <View className="flex-row items-center gap-1">
                      <Button variant="secondary" className="h-9 w-9 min-w-0 rounded-full px-0" onPress={() => onMarkPending(item)}>
                        <Undo2 color="#2563eb" size={18} />
                      </Button>
                      <Button variant="secondary" className="h-9 w-9 min-w-0 rounded-full px-0" onPress={() => onRemoveItem(item)}>
                        <Trash2 color="#dc2626" size={18} />
                      </Button>
                    </View>
                  </ListGroup.ItemSuffix>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        </View>
      </ScrollView>

      <View className="absolute bottom-4 left-4 right-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <DollarSign color="#16a34a" size={18} />
            <Text className="ml-2 text-sm text-gray-600 dark:text-zinc-300 font-noto">ราคารวม</Text>
          </View>
          <Text className="text-xl text-green-600 dark:text-green-400 font-noto-bold">{totalPrice.toFixed(2)}</Text>
        </View>
      </View>
    </>
  );
}
