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
    const clearBadSession = async () => {
      await supabase.auth.signOut();
      setSession(null);
      router.replace("/login");
    };

    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          const msg = error.message ?? "";
          if (
            msg.includes("Refresh Token") ||
            msg.includes("Invalid Refresh Token") ||
            (error as { name?: string }).name === "AuthApiError"
          ) {
            void clearBadSession();
            return;
          }
        }
        setSession(session);
        if (session) checkFamilyStatus(session.user.id);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("Refresh Token") || msg.includes("Invalid Refresh")) {
          void clearBadSession();
        }
      })
      .finally(() => {
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
        <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="create-family" />
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        </Stack>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}