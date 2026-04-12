import { Stack, useRouter, useSegments } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import {
  NotoSansThai_400Regular,
  NotoSansThai_700Bold,
} from "@expo-google-fonts/noto-sans-thai";
import { useEffect, useState } from "react";
import "../../src/global.css";
import { supabase } from "../lib/supabase";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    NotoSansThai_400Regular,
    NotoSansThai_700Bold,
  });

  const checkFamilyStatus = async (userId: string) => {
    // await new Promise(resolve => setTimeout(resolve, 2000));
    const { data, error } = await supabase
      .from("profiles")
      .select("family_id")
      .eq("id", userId)
      .single();

    if (error || !data?.family_id) {
      router.replace("/create-family");
    } else {
      router.replace("/dashboard");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkFamilyStatus(session.user.id);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkFamilyStatus(session.user.id);
      else router.replace("/login");
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="create-family" />
          <Stack.Screen name="dashboard/index" />
          <Stack.Screen name="dashboard/setting" options={{ headerShown: true, title: 'ตั้งค่าครอบครัว' }} />
        </Stack>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}