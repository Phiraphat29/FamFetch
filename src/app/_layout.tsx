import { Stack } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import {
  NotoSansThai_400Regular,
  NotoSansThai_700Bold,
} from "@expo-google-fonts/noto-sans-thai";
import { useEffect } from "react";
import "../../src/global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NotoSansThai_400Regular,
    NotoSansThai_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    </HeroUINativeProvider>
  );
}