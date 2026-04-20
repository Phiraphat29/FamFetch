import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, ScrollView, Text, useColorScheme, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import { ChevronLeft } from "lucide-react-native";
import { supabase } from "../../../lib/supabase";
import { InventoryItemPriceSummary } from "../../../components/inventory/InventoryItemPriceSummary";
import { InventoryPurchaseHistoryListView } from "../../../components/inventory/InventoryPurchaseHistoryListView";
import type { InventoryItemDetail, ListItemPurchaseRow, PurchaseHistoryEntry } from "../../../components/inventory/inventoryItemDetailTypes";
import { normalizeRows } from "../../../components/inventory/inventoryItemDetailUtils";

function parseItemId(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? (value[0] ?? "") : value;
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
            <InventoryItemPriceSummary history={history} />

            <Text className="mb-2 mt-2 text-xs font-noto-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
              ประวัติการซื้อ
            </Text>

            <InventoryPurchaseHistoryListView history={history} currentUserId={currentUserId} />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
