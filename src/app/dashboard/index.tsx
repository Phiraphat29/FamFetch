import React, { useEffect, useState } from "react";
import { View, ScrollView, ActivityIndicator, Alert, Text } from "react-native";
import { ShoppingCart, Package, LogOut } from "lucide-react-native";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";
import ProfileHeader from "../../components/ProfileHeader";
import MenuActionCard from "../../components/MenuActionCard";
import LogoutDialog from "../../components/dialog/LogoutDialog";

export default function Dashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [family, setFamily] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData);

            if (profileData?.family_id) {
                const { data: familyData, error: familyError } = await supabase
                    .from("families")
                    .select("*")
                    .eq("id", profileData.family_id)
                    .single();

                if (familyError) throw familyError;
                setFamily(familyData);
            }
        } catch (error: any) {
            Alert.alert("เกิดข้อผิดพลาด", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setIsLogoutDialogOpen(true);
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white dark:bg-black">
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-50 dark:bg-zinc-900 p-6">
            <ProfileHeader profile={profile} family={family} />

            <View className="gap-6">
                <MenuActionCard
                    title="บิลซื้อของครอบครัว"
                    description="ไปซูเปอร์มาร์เก็ตรอบนี้มีอะไรต้องซื้อบ้าง? เปิดบิลใหม่แล้วให้คนในบ้านช่วยกันลิสต์ของได้เลย!"
                    icon={<ShoppingCart color="#000" size={22} />}
                    buttonText="เปิดบิลใหม่"
                    onPress={() => console.log("ไปหน้าสร้างบิล")}
                />

                <MenuActionCard
                    title="คลังสินค้าส่วนกลาง"
                    description="เพิ่มรายการของใช้ประจำบ้าน เช่น สบู่ ยาสระผม หมูสับ เอาไว้ดึงไปใส่ในบิลง่ายๆ แถมยังเทียบราคาย้อนหลังได้ด้วย"
                    icon={<Package color="#000" size={22} />}
                    buttonText="จัดการคลังสินค้า"
                    variant="secondary"
                    isOutlinedButton={true}
                    onPress={() => console.log("ไปหน้าคลัง")}
                />
            </View>
        </ScrollView>
    );
}