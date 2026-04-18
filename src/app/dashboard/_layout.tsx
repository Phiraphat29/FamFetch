import { Tabs, useSegments } from "expo-router";
import { Home, Package, ShoppingCart } from "lucide-react-native";
import { ActivityIndicator, useColorScheme, View } from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { TabBarIcon, type LucideTabIconComponent } from "../../components/TabBarIcon";
import ProfileHeader from "../../components/ProfileHeader";
import { supabase } from "../../lib/supabase";

type TabBarIconRenderArgs = Parameters<
  NonNullable<BottomTabNavigationOptions["tabBarIcon"]>
>[0];

const ACTIVE_LIGHT = "#0a0a0a";
const ACTIVE_DARK = "#fafafa";
const INACTIVE_LIGHT = "#a1a1aa";
const INACTIVE_DARK = "#71717a";

/** Show shared header only on the three main tab roots, not on stack-style child routes. */
function shouldShowProfileHeaderFromSegments(segments: string[]): boolean {
  const s = segments.filter(Boolean);
  const i = s.indexOf("dashboard");
  if (i === -1) return false;
  const rest = s.slice(i + 1);

  if (rest.length === 0) return true;
  if (rest[0] === "index" && rest.length === 1) return true;

  if (rest[0] === "member" || rest[0] === "setting") return false;

  if (rest[0] === "shopping") {
    if (rest.length === 1) return true;
    if (rest.length === 2 && rest[1] === "index") return true;
    return false;
  }

  if (rest[0] === "inventory") {
    if (rest.length === 1) return true;
    if (rest.length === 2 && rest[1] === "index") return true;
    return false;
  }

  return false;
}

export default function DashboardTabLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const insets = useSafeAreaInsets();
  const segments = useSegments();

  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [family, setFamily] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const showProfileHeader = useMemo(() => {
    const s = segments as string[];
    if (!s.length) return true;
    return shouldShowProfileHeaderFromSegments(s);
  }, [segments]);

  const loadProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setProfile(null);
        setFamily(null);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData as Record<string, unknown>);

      if (profileData?.family_id) {
        const { data: familyData, error: familyError } = await supabase
          .from("families")
          .select("*")
          .eq("id", profileData.family_id)
          .single();

        if (familyError) throw familyError;
        setFamily(familyData as Record<string, unknown>);
      } else {
        setFamily(null);
      }
    } catch {
      setProfile(null);
      setFamily(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const activeTint = isDark ? ACTIVE_DARK : ACTIVE_LIGHT;
  const inactiveTint = isDark ? INACTIVE_DARK : INACTIVE_LIGHT;
  const barBg = isDark ? "#18181b" : "#ffffff";
  const borderTop = isDark ? "#27272a" : "#f4f4f5";

  const tabIcon = (Icon: LucideTabIconComponent) => {
    return ({ color, focused, size }: TabBarIconRenderArgs) => (
      <TabBarIcon Icon={Icon} focused={focused} color={color} size={size} />
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
      {showProfileHeader ? (
        <View
          className="border-b border-gray-200 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 px-4"
          style={{ paddingTop: Math.max(insets.top, 8) }}
        >
          {profileLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="small" color={isDark ? "#fafafa" : "#171717"} />
            </View>
          ) : (
            <ProfileHeader profile={profile} family={family} className="mb-4 mt-1 w-full items-center" />
          )}
        </View>
      ) : null}
      <View className="flex-1">
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: activeTint,
            tabBarInactiveTintColor: inactiveTint,
            tabBarLabelStyle: {
              fontSize: 11,
              fontFamily: "NotoSansThai_400Regular",
              marginTop: 2,
            },
            tabBarStyle: {
              backgroundColor: barBg,
              borderTopWidth: 1,
              borderTopColor: borderTop,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              minHeight: 52 + insets.bottom,
              height: 52 + insets.bottom,
              paddingTop: 6,
              paddingBottom: Math.max(insets.bottom, 8),
              paddingHorizontal: 8,
              elevation: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: isDark ? 0.35 : 0.08,
              shadowRadius: 10,
            },
            tabBarItemStyle: {
              paddingVertical: 4,
            },
            tabBarBackground: () => (
              <View
                style={{
                  flex: 1,
                  backgroundColor: barBg,
                  borderTopLeftRadius: 18,
                  borderTopRightRadius: 18,
                  overflow: "hidden",
                }}
              />
            ),
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              tabBarLabel: "หน้าหลัก",
              tabBarIcon: tabIcon(Home),
            }}
          />
          <Tabs.Screen
            name="shopping/index"
            options={{
              tabBarLabel: "บิลซื้อของ",
              tabBarIcon: tabIcon(ShoppingCart),
            }}
          />
          <Tabs.Screen
            name="inventory/index"
            options={{
              tabBarLabel: "คลังของใช้",
              tabBarIcon: tabIcon(Package),
            }}
          />
          <Tabs.Screen
            name="inventory/[id]"
            options={{
              href: null,
              headerShown: false,
            }}
          />
          <Tabs.Screen
            name="shopping/[id]"
            options={{
              href: null,
              headerShown: false,
            }}
          />
          <Tabs.Screen
            name="member"
            options={{
              href: null,
              headerShown: true,
              title: "รายชื่อสมาชิกครอบครัว",
            }}
          />
          <Tabs.Screen
            name="setting"
            options={{
              href: null,
              headerShown: true,
              title: "ตั้งค่าครอบครัว",
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}
