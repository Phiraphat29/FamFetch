import { useMemo } from "react";
import { Text, View } from "react-native";
import { Card } from "heroui-native";
import { Minus, TrendingDown, TrendingUp } from "lucide-react-native";
import { money, computePriceAnalytics } from "./inventoryItemDetailUtils";
import type { PurchaseHistoryEntry } from "./inventoryItemDetailTypes";

type InventoryItemPriceSummaryProps = {
  history: PurchaseHistoryEntry[];
};

export function InventoryItemPriceSummary({ history }: InventoryItemPriceSummaryProps) {
  const analytics = useMemo(() => computePriceAnalytics(history), [history]);

  const trendIcon = useMemo(() => {
    if (analytics.trend === "UP") {
      return <TrendingUp color="#dc2626" size={22} strokeWidth={2.5} />;
    }
    if (analytics.trend === "DOWN") {
      return <TrendingDown color="#16a34a" size={22} strokeWidth={2.5} />;
    }
    if (analytics.trend === "UNCHANGED") {
      return <Minus color="#737373" size={20} strokeWidth={2.5} />;
    }
    return null;
  }, [analytics.trend]);

  if (analytics.purchaseCountWithPrice === 0) {
    return (
      <Card className="mb-4 rounded-2xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
        <Card.Body className="p-4">
          <Text className="text-sm text-gray-600 dark:text-zinc-300 font-noto">
            ยังไม่มีราคาที่บันทึกจากบิลซื้อของ (กดชำระเงินในบิลและกรอกราคาเพื่อเปรียบเทียบได้)
          </Text>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <View className="mb-2 flex-row flex-wrap gap-2">
        <Card className="min-w-[31%] flex-1 rounded-2xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
          <Card.Body className="p-3">
            <Text className="text-[10px] uppercase text-gray-500 dark:text-zinc-400 font-noto-bold">ล่าสุด</Text>
            <View className="mt-1 flex-row items-center gap-1">
              <Text
                className="text-base text-black dark:text-white font-noto-bold"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {money.format(analytics.latest ?? 0)}
              </Text>
              {trendIcon}
            </View>
          </Card.Body>
        </Card>

        <Card className="min-w-[31%] flex-1 rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50">
          <Card.Body className="p-3">
            <Text className="text-[10px] uppercase text-emerald-800 dark:text-emerald-200 font-noto-bold">ถูกที่สุด</Text>
            <Text
              className="mt-1 text-base text-emerald-900 dark:text-emerald-100 font-noto-bold"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {money.format(analytics.lowest ?? 0)}
            </Text>
          </Card.Body>
        </Card>

        <Card className="min-w-[31%] flex-1 rounded-2xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
          <Card.Body className="p-3">
            <Text className="text-[10px] uppercase text-gray-500 dark:text-zinc-400 font-noto-bold">เฉลี่ย</Text>
            <Text
              className="mt-1 text-base text-black dark:text-white font-noto-bold"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {money.format(analytics.average ?? 0)}
            </Text>
          </Card.Body>
        </Card>
      </View>

      <View className="mb-4 rounded-2xl border border-gray-100 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-800/80">
        <Text className="text-xs text-gray-600 dark:text-zinc-300 font-noto">
          สูงสุดในรอบที่บันทึก:{" "}
          <Text className="font-noto-bold text-black dark:text-white">{money.format(analytics.highest ?? 0)}</Text>
          {" · "}
          <Text className="text-gray-500 dark:text-zinc-400">{analytics.purchaseCountWithPrice} ครั้งที่มีราคา</Text>
        </Text>
      </View>
    </>
  );
}
