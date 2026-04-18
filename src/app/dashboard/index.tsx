import React from "react";
import { ScrollView, View } from "react-native";
import { ShoppingCart, Package } from "lucide-react-native";
import { useRouter } from "expo-router";
import MenuActionCard from "../../components/MenuActionCard";

export default function Dashboard() {
    const router = useRouter();

    return (
        <ScrollView className="flex-1 bg-gray-50 dark:bg-zinc-900 px-6 pb-8 pt-4">
            <View className="gap-6">
                <MenuActionCard
                    title="บิลซื้อของครอบครัว"
                    description="ไปซูเปอร์มาร์เก็ตรอบนี้มีอะไรต้องซื้อบ้าง? เปิดบิลใหม่แล้วให้คนในบ้านช่วยกันลิสต์ของได้เลย!"
                    icon={<ShoppingCart color="#000" size={22} />}
                    buttonText="เปิดบิลใหม่"
                    onPress={() => router.push("/dashboard/shopping")}
                />

                <MenuActionCard
                    title="คลังสินค้าส่วนกลาง"
                    description="เพิ่มรายการของใช้ประจำบ้าน เช่น สบู่ ยาสระผม หมูสับ เอาไว้ดึงไปใส่ในบิลง่ายๆ แถมยังเทียบราคาย้อนหลังได้ด้วย"
                    icon={<Package color="#000" size={22} />}
                    buttonText="จัดการคลังสินค้า"
                    variant="secondary"
                    isOutlinedButton={true}
                    onPress={() => router.push("/dashboard/inventory")}
                />
            </View>
        </ScrollView>
    );
}
