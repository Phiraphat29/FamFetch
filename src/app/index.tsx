import { View, ActivityIndicator, Image, Text } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center p-8 bg-white dark:bg-black">
      <Image source={require("../../assets/images/logo.png")} className="w-30 h-30" />
      <Text className="text-3xl font-noto-bold text-black dark:text-white mt-4">FamFetch 🛒</Text>
      <Text className="text-xl text-center text-zinc-900 dark:text-zinc-100 my-5 font-noto">แอปพลิเคชันสำหรับจัดการรายการสั่งซื้อสินค้าในครอบครัว</Text>
      <ActivityIndicator size="large" color="#0000ff" className="mt-10" />
    </View>
  );
}