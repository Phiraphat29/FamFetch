import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { ShoppingCart, Package, ClipboardList, Clock3 } from "lucide-react-native";
import { useFocusEffect, useRouter } from "expo-router";
import MenuActionCard from "../../components/MenuActionCard";
import { supabase } from "../../lib/supabase";

type LatestTrip = {
  id: string;
  title: string;
  created_at: string;
  is_completed: boolean | null;
};

type HomeStats = {
  familyName: string;
  displayName: string;
  inventoryCount: number;
  pendingCount: number;
  latestTrip: LatestTrip | null;
};

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<HomeStats>({
    familyName: "ครอบครัว",
    displayName: "ผู้ใช้งาน",
    inventoryCount: 0,
    pendingCount: 0,
    latestTrip: null,
  });

  const fetchHomeStats = useCallback(async () => {
    try {
      setErrorMessage(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setErrorMessage("ไม่พบการลงชื่อเข้าใช้ กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("family_id,full_name")
        .eq("id", session.user.id)
        .single();
      if (profileError) throw profileError;

      if (!profileData?.family_id) {
        setStats((prev) => ({
          ...prev,
          displayName: profileData?.full_name || "ผู้ใช้งาน",
          familyName: "ยังไม่มีครอบครัว",
          inventoryCount: 0,
          pendingCount: 0,
          latestTrip: null,
        }));
        setErrorMessage("ยังไม่พบครอบครัวที่เชื่อมกับบัญชีนี้");
        return;
      }

      const familyId = profileData.family_id;

      const [familyResult, inventoryCountResult, latestTripResult, openTripsResult] = await Promise.all([
        supabase.from("families").select("name").eq("id", familyId).single(),
        supabase.from("items").select("id", { count: "exact", head: true }).eq("family_id", familyId),
        supabase
          .from("shopping_lists")
          .select("id,title,created_at,is_completed")
          .eq("family_id", familyId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("shopping_lists").select("id").eq("family_id", familyId).eq("is_completed", false),
      ]);

      if (familyResult.error) throw familyResult.error;
      if (inventoryCountResult.error) throw inventoryCountResult.error;
      if (latestTripResult.error) throw latestTripResult.error;
      if (openTripsResult.error) throw openTripsResult.error;

      const openTripIds = (openTripsResult.data ?? []).map((trip) => trip.id);
      let pendingCount = 0;

      if (openTripIds.length > 0) {
        const { count: pendingItemsCount, error: pendingItemsError } = await supabase
          .from("list_items")
          .select("id", { count: "exact", head: true })
          .in("list_id", openTripIds)
          .eq("is_bought", false);
        if (pendingItemsError) throw pendingItemsError;
        pendingCount = pendingItemsCount ?? 0;
      }

      setStats({
        familyName: familyResult.data?.name || "ครอบครัว",
        displayName: profileData?.full_name || "ผู้ใช้งาน",
        inventoryCount: inventoryCountResult.count ?? 0,
        pendingCount,
        latestTrip: (latestTripResult.data as LatestTrip | null) ?? null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลหน้าหลักได้";
      setErrorMessage(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeStats();
  }, [fetchHomeStats]);

  useFocusEffect(
    useCallback(() => {
      fetchHomeStats();
    }, [fetchHomeStats])
  );

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        fetchHomeStats();
      }, 250);
    };

    const channel = supabase
      .channel("dashboard-home-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "shopping_lists" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "list_items" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "families" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, scheduleRefresh)
      .subscribe();

    return () => {
      if (timeout) clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [fetchHomeStats]);

  const latestTripLabel = useMemo(() => {
    if (!stats.latestTrip) return "ยังไม่มีทริปล่าสุด";
    const dateLabel = new Date(stats.latestTrip.created_at).toLocaleDateString();
    const status = stats.latestTrip.is_completed ? "ปิดทริปแล้ว" : "กำลังดำเนินการ";
    return `${stats.latestTrip.title} · ${dateLabel} · ${status}`;
  }, [stats.latestTrip]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <ActivityIndicator size="large" color="#111827" />
        <Text className="mt-3 text-sm text-gray-600 dark:text-zinc-300 font-noto">กำลังโหลดหน้าหลัก...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-zinc-900 px-6 pb-8 pt-4"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchHomeStats();
          }}
        />
      }
    >
      <View className="mb-5">
        <Text className="text-2xl text-black dark:text-white font-noto-bold">หน้าหลัก</Text>
        <Text className="mt-1 text-sm text-gray-600 dark:text-zinc-300 font-noto">
          สวัสดี {stats.displayName} · บ้าน {stats.familyName}
        </Text>
      </View>

      {errorMessage ? (
        <View className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
          <Text className="text-sm text-red-700 dark:text-red-300 font-noto">{errorMessage}</Text>
        </View>
      ) : null}

      <View className="mb-6 flex-row gap-3">
        <View className="flex-1 rounded-2xl border border-gray-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <View className="mb-2 flex-row items-center gap-2">
            <ClipboardList size={16} color="#2563eb" />
            <Text className="text-xs text-gray-500 dark:text-zinc-400 font-noto">ของค้างซื้อ</Text>
          </View>
          <Text className="text-2xl text-black dark:text-white font-noto-bold">{stats.pendingCount}</Text>
          <Text className="mt-1 text-xs text-gray-500 dark:text-zinc-400 font-noto">รายการที่ยังไม่เช็กเอาต์</Text>
        </View>
        <View className="flex-1 rounded-2xl border border-gray-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
          <View className="mb-2 flex-row items-center gap-2">
            <Package size={16} color="#16a34a" />
            <Text className="text-xs text-gray-500 dark:text-zinc-400 font-noto">ในคลัง</Text>
          </View>
          <Text className="text-2xl text-black dark:text-white font-noto-bold">{stats.inventoryCount}</Text>
          <Text className="mt-1 text-xs text-gray-500 dark:text-zinc-400 font-noto">รายการสินค้าเทมเพลต</Text>
        </View>
      </View>

      <View className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <View className="mb-2 flex-row items-center gap-2">
          <Clock3 size={16} color="#7c3aed" />
          <Text className="text-sm text-black dark:text-white font-noto-bold">ทริปล่าสุด</Text>
        </View>
        <Text className="text-sm text-gray-600 dark:text-zinc-300 font-noto">{latestTripLabel}</Text>
      </View>

      <View className="gap-6">
        <MenuActionCard
          title="บิลซื้อของครอบครัว"
          description="ไปซูเปอร์มาร์เก็ตรอบนี้มีอะไรต้องซื้อบ้าง? เปิดบิลใหม่แล้วให้คนในบ้านช่วยกันลิสต์ของได้เลย!"
          icon={<ShoppingCart color="#000" size={22} />}
          buttonText="ไปหน้ารายการซื้อของ"
          onPress={() => router.push("/dashboard/shopping")}
        />

        <MenuActionCard
          title="คลังสินค้าส่วนกลาง"
          description="เพิ่มรายการของใช้ประจำบ้าน เช่น สบู่ ยาสระผม หมูสับ เอาไว้ดึงไปใส่ในบิลง่ายๆ แถมยังเทียบราคาย้อนหลังได้ด้วย"
          icon={<Package color="#000" size={22} />}
          buttonText="ไปหน้าคลังสินค้า"
          variant="secondary"
          isOutlinedButton={true}
          onPress={() => router.push("/dashboard/inventory")}
        />
      </View>
    </ScrollView>
  );
}
