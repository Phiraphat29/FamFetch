import { Text, View } from "react-native";
import { Avatar, ListGroup } from "heroui-native";
import { formatTripDate, initialsFromName, money } from "./inventoryItemDetailUtils";
import type { PurchaseHistoryEntry } from "./inventoryItemDetailTypes";

type InventoryPurchaseHistoryListViewProps = {
  history: PurchaseHistoryEntry[];
  currentUserId: string | null;
};

export function InventoryPurchaseHistoryListView({ history, currentUserId }: InventoryPurchaseHistoryListViewProps) {
  if (history.length === 0) {
    return (
      <View className="items-center rounded-2xl border border-dashed border-gray-300 bg-white py-10 dark:border-zinc-600 dark:bg-zinc-800/60">
        <Text className="px-6 text-center text-sm text-gray-500 dark:text-zinc-400 font-noto">
          ยังไม่มีประวัติการซื้อสำหรับสินค้านี้
        </Text>
      </View>
    );
  }

  return (
    <ListGroup className="rounded-2xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 overflow-hidden">
      {history.map((row, index) => {
        const isLast = index === history.length - 1;
        const showYou = row.purchaserId != null && row.purchaserId === currentUserId;
        return (
          <ListGroup.Item key={row.id}>
            <ListGroup.ItemPrefix>
              <View className="w-5 items-center pt-1">
                <View className="h-2.5 w-2.5 rounded-full bg-gray-400 dark:bg-zinc-500" />
                {!isLast ? <View className="mt-0.5 min-h-[20px] w-px flex-1 bg-gray-200 dark:bg-zinc-600" /> : null}
              </View>
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <Text className="text-[11px] text-gray-500 dark:text-zinc-400 font-noto">{formatTripDate(row.tripDateIso)}</Text>
              <ListGroup.ItemTitle className="mt-0.5 text-base text-black dark:text-white font-noto-bold" numberOfLines={2}>
                {row.tripTitle}
              </ListGroup.ItemTitle>
              <View className="mt-2 flex-row items-center justify-between gap-2">
                <Text className="text-lg text-black dark:text-white font-noto-bold">
                  {row.price != null ? money.format(row.price) : "—"}
                </Text>
                <View className="max-w-fit flex-row items-center justify-end gap-1">
                  <Avatar size="sm" className="h-8 w-8" alt={row.purchaserName}>
                    {row.purchaserAvatarUrl ? (
                      <Avatar.Image source={{ uri: row.purchaserAvatarUrl }} alt={row.purchaserName} />
                    ) : null}
                    <Avatar.Fallback className="bg-gray-200 dark:bg-zinc-600">
                      <Text className="text-[10px] font-noto-bold text-gray-700 dark:text-zinc-200">
                        {initialsFromName(row.purchaserName)}
                      </Text>
                    </Avatar.Fallback>
                  </Avatar>
                  <Text className="text-right text-xs text-gray-600 dark:text-zinc-300 font-noto" numberOfLines={2}>
                    จ่ายโดย {showYou ? "คุณ" : row.purchaserName}
                  </Text>
                </View>
              </View>
            </ListGroup.ItemContent>
          </ListGroup.Item>
        );
      })}
    </ListGroup>
  );
}
