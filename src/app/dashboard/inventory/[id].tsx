import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, ScrollView, Text, useColorScheme, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, Button, Card, ListGroup } from "heroui-native";
import { ChevronLeft, Minus, TrendingDown, TrendingUp } from "lucide-react-native";
import { supabase } from "../../../lib/supabase";

type InventoryItemDetail = {
  id: string;
  family_id: string;
  name: string;
  category: string | null;
  created_at: string;
};

type ShoppingListEmbed = {
  id: string;
  title: string;
  created_at: string;
  family_id: string;
};

type PurchaserEmbed = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

/** Row shape returned by Supabase nested select (aliases + relations). */
type ListItemPurchaseRow = {
  id: string;
  list_id: string;
  purchased_price: number | string | null;
  purchased_by: string | null;
  created_at: string;
  shopping_lists: ShoppingListEmbed | ShoppingListEmbed[] | null;
  purchaser: PurchaserEmbed | PurchaserEmbed[] | null;
};

type PurchaseHistoryEntry = {
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

type PriceTrend = "UP" | "DOWN" | "UNCHANGED";

const money = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 2,
});

function parseItemId(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

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

function normalizeRows(raw: ListItemPurchaseRow[], familyId: string): PurchaseHistoryEntry[] {
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

function initialsFromName(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  const a = parts[0]![0] ?? "";
  const b = parts[parts.length - 1]![0] ?? "";
  return (a + b).toUpperCase();
}

function computePriceAnalytics(sortedHistory: PurchaseHistoryEntry[]) {
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

function formatTripDate(iso: string): string {
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

export default function InventoryItemDetailScreen() {
  const { id: idParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const itemId = parseItemId(idParam);
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const [item, setItem] = useState<InventoryItemDetail | null>(null);
  const [history, setHistory] = useState<PurchaseHistoryEntry[]>([]);
  const loadRequestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++loadRequestIdRef.current;
    setLoading(true);
    setErrorMessage(null);
    setItem(null);
    setHistory([]);

    if (!itemId) {
      if (requestId === loadRequestIdRef.current) {
        setErrorMessage("ไม่พบรหัสสินค้า");
        setLoading(false);
      }
      return;
    }

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        if (requestId === loadRequestIdRef.current) {
          setErrorMessage("การลงชื่อเข้าใช้งานหมดอายุ กรุณาลงชื่อเข้าใช้งานใหม่");
          setLoading(false);
        }
        return;
      }

      if (requestId === loadRequestIdRef.current) {
        setCurrentUserId(session.user.id);
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("family_id")
        .eq("id", session.user.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData?.family_id) {
        if (requestId === loadRequestIdRef.current) {
          setErrorMessage("ไม่พบครอบครัวของคุณ");
          setLoading(false);
        }
        return;
      }

      const [itemResult, historyResult] = await Promise.all([
        supabase
          .from("items")
          .select("id,family_id,name,category,created_at")
          .eq("id", itemId)
          .eq("family_id", profileData.family_id)
          .maybeSingle(),
        supabase
          .from("list_items")
          .select(
            `
            id,
            list_id,
            purchased_price,
            purchased_by,
            created_at,
            shopping_lists ( id, title, created_at, family_id ),
            purchaser:profiles!list_items_purchased_by_fkey ( id, full_name, avatar_url )
          `
          )
          .eq("item_id", itemId)
          .eq("is_bought", true),
      ]);

      if (itemResult.error) throw itemResult.error;
      if (historyResult.error) throw historyResult.error;

      if (!itemResult.data) {
        if (requestId === loadRequestIdRef.current) {
          setErrorMessage("ไม่พบสินค้านี้ในคลังของครอบครัวคุณ");
          setLoading(false);
        }
        return;
      }

      if (requestId === loadRequestIdRef.current) {
        setItem(itemResult.data as InventoryItemDetail);
        const normalized = normalizeRows((historyResult.data ?? []) as ListItemPurchaseRow[], profileData.family_id);
        setHistory(normalized);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ";
      if (requestId === loadRequestIdRef.current) {
        setErrorMessage(message);
      }
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [itemId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, itemId])
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace("/dashboard/inventory");
        return true;
      };

      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => sub.remove();
    }, [])
  );

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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <ActivityIndicator size="large" color="#111827" />
        <Text className="mt-3 text-sm text-gray-600 dark:text-zinc-300 font-noto">กำลังโหลดประวัติการซื้อ...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
      <View
        className="border-b border-gray-200 bg-white px-3 pb-3 dark:border-zinc-800 dark:bg-zinc-950"
        style={{ paddingTop: Math.max(insets.top, 12) }}
      >
        <View className="flex-row items-center gap-1">
          <Button
            variant="secondary"
            className="h-10 w-10 min-w-0 rounded-full px-0"
            onPress={() => router.replace("/dashboard/inventory")}
          >
            <ChevronLeft color={colorScheme === "dark" ? "#fafafa" : "#171717"} size={24} />
          </Button>
          <View className="min-w-0 flex-1 pl-1">
            <Text className="text-lg text-black dark:text-white font-noto-bold" numberOfLines={2}>
              {item?.name ?? "รายละเอียดสินค้า"}
            </Text>
            {item?.category ? (
              <Text className="text-xs text-gray-500 dark:text-zinc-400 font-noto" numberOfLines={1}>
                {item.category}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="pb-10">
        {errorMessage ? (
          <View className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
            <Text className="text-sm text-red-700 dark:text-red-300 font-noto">{errorMessage}</Text>
            <Button variant="secondary" className="mt-3 rounded-full border border-red-300 dark:border-red-700" onPress={load}>
              <Text className="text-sm text-red-700 dark:text-red-300 font-noto-bold">ลองใหม่</Text>
            </Button>
          </View>
        ) : null}

        {item && !errorMessage ? (
          <>
            <Text className="mb-2 text-xs font-noto-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
              สถิติราคา
            </Text>
            {analytics.purchaseCountWithPrice === 0 ? (
              <Card className="mb-4 rounded-2xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                <Card.Body className="p-4">
                  <Text className="text-sm text-gray-600 dark:text-zinc-300 font-noto">
                    ยังไม่มีราคาที่บันทึกจากบิลซื้อของ (กดชำระเงินในบิลและกรอกราคาเพื่อเปรียบเทียบได้)
                  </Text>
                </Card.Body>
              </Card>
            ) : (
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
                      <Text className="text-[10px] uppercase text-emerald-800 dark:text-emerald-200 font-noto-bold">
                        ถูกที่สุด
                      </Text>
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
                    <Text className="text-gray-500 dark:text-zinc-400">
                      {analytics.purchaseCountWithPrice} ครั้งที่มีราคา
                    </Text>
                  </Text>
                </View>
              </>
            )}

            <Text className="mb-2 mt-2 text-xs font-noto-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
              ประวัติการซื้อ
            </Text>

            {history.length === 0 ? (
              <View className="items-center rounded-2xl border border-dashed border-gray-300 bg-white py-10 dark:border-zinc-600 dark:bg-zinc-800/60">
                <Text className="text-sm text-gray-500 dark:text-zinc-400 font-noto px-6 text-center">
                  ยังไม่มีประวัติการซื้อสำหรับสินค้านี้
                </Text>
              </View>
            ) : (
              <ListGroup className="rounded-2xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 overflow-hidden">
                {history.map((row, index) => {
                  const isLast = index === history.length - 1;
                  const showYou = row.purchaserId != null && row.purchaserId === currentUserId;
                  return (
                    <ListGroup.Item key={row.id}>
                      <ListGroup.ItemPrefix>
                        <View className="w-5 items-center pt-1">
                          <View className="h-2.5 w-2.5 rounded-full bg-gray-400 dark:bg-zinc-500" />
                          {!isLast ? (
                            <View className="mt-0.5 w-px flex-1 min-h-[20px] bg-gray-200 dark:bg-zinc-600" />
                          ) : null}
                        </View>
                      </ListGroup.ItemPrefix>
                      <ListGroup.ItemContent>
                        <Text className="text-[11px] text-gray-500 dark:text-zinc-400 font-noto">
                          {formatTripDate(row.tripDateIso)}
                        </Text>
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
                            <Text
                              className="text-right text-xs text-gray-600 dark:text-zinc-300 font-noto"
                              numberOfLines={2}
                            >
                              จ่ายโดย {showYou ? "คุณ" : row.purchaserName}
                            </Text>
                          </View>
                        </View>
                      </ListGroup.ItemContent>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
