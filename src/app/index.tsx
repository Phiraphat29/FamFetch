import { View, Text } from "react-native";
import { Button } from "heroui-native";
import { Link } from "expo-router";
import { Image } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black font-noto">
      <View className="mb-8">
        <Image source={require("../../assets/images/logo.png")} className="w-30 h-30" />
      </View>
      <Text className="text-2xl font-noto-bold text-black dark:text-white mb-2">
        FamFetch 🛒
      </Text>
      <Text className="text-sm text-gray-500 dark:text-gray-400 mb-10 font-noto">แอปสำหรับจัดการรายการสั่งซื้อสินค้าในครอบครัว</Text>

      <Link href="/login" asChild>
        <Button variant="primary" className="w-1/2 rounded-full">
          <Button.Label className="font-noto-bold">เริ่มช้อปกัน!</Button.Label>
        </Button>
      </Link>
    </View>
  );
}