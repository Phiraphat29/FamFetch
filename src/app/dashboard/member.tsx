import React, { useEffect, useState } from "react";
import { View, ScrollView, ActivityIndicator, Alert, Pressable, Image, Text } from "react-native";
import { ListGroup } from "heroui-native";
import { Crown, UserMinus } from "lucide-react-native";
import { supabase } from "../../lib/supabase";

export default function FamilyMembersScreen() {
    const [members, setMembers] = useState<any[]>([]);
    const [family, setFamily] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            setCurrentUser(session.user);

            const { data: myProfile } = await supabase
                .from("profiles")
                .select("family_id")
                .eq("id", session.user.id)
                .single();

            if (!myProfile?.family_id) return;

            // 3. ดึงข้อมูลบ้าน (เพื่อเอา admin_id มาเช็ค)
            const { data: familyData } = await supabase
                .from("families")
                .select("*")
                .eq("id", myProfile.family_id)
                .single();
            setFamily(familyData);

            // 4. ดึงรายชื่อสมาชิกทุกคนในบ้านนี้
            const { data: membersData } = await supabase
                .from("profiles")
                .select("*")
                .eq("family_id", myProfile.family_id);

            if (membersData) setMembers(membersData);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // ---------------- L O G I C ----------------

    // ตัวแปรเช็คว่าตัวเราเป็นแอดมินไหม (ถ้าใช่ จะได้สิทธิ์โชว์ปุ่มจัดการ)
    const isMeAdmin = currentUser?.id === family?.admin_id;

    const handleTransferAdmin = (targetUserId: string, targetUserName: string) => {
        Alert.alert(
            "มอบมงกุฎหัวหน้าครอบครัว 👑",
            `แน่ใจนะว่าจะยกตำแหน่งแอดมินให้ ${targetUserName}? คุณจะกลายเป็นสมาชิกธรรมดาทันที`,
            [
                { text: "ยกเลิก", style: "cancel" },
                {
                    text: "มอบตำแหน่ง",
                    onPress: () => console.log("TODO: อัปเดต families.admin_id เป็น", targetUserId)
                }
            ]
        );
    };

    const handleKickMember = (targetUserId: string, targetUserName: string) => {
        Alert.alert(
            "เตะออกจากบ้าน 🚪",
            `ต้องการลบ ${targetUserName} ออกจากครอบครัวใช่หรือไม่?`,
            [
                { text: "ยกเลิก", style: "cancel" },
                {
                    text: "เตะออก",
                    style: "destructive",
                    onPress: () => console.log("TODO: อัปเดต profiles.family_id ของคนนี้ให้เป็น null")
                }
            ]
        );
    };

    // ---------------- U I ----------------

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-zinc-900">
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-50 dark:bg-zinc-900 p-4">
            <View className="mb-6 mt-4 px-2">
                <Text className="text-2xl font-noto-bold text-black dark:text-white">
                    สมาชิกครอบครัว
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                    บ้าน: {family?.name}
                </Text>
            </View>

            <ListGroup className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
                {members.map((member) => {
                    const isThisMemberAdmin = member.id === family?.admin_id;
                    const isThisMe = member.id === currentUser?.id;

                    return (
                        <ListGroup.Item key={member.id}>
                            {/* รูปโปรไฟล์ */}
                            <ListGroup.ItemPrefix>
                                {member.avatar_url ? (
                                    <Image
                                        source={{ uri: member.avatar_url }}
                                        className="w-10 h-10 rounded-full border border-gray-200"
                                    />
                                ) : (
                                    <View className="w-10 h-10 rounded-full bg-gray-300" />
                                )}
                            </ListGroup.ItemPrefix>

                            {/* ข้อมูลชื่อ */}
                            <ListGroup.ItemContent>
                                <View className="flex-row items-center gap-2">
                                    <ListGroup.ItemTitle className="font-noto-bold text-base text-black dark:text-white">
                                        {member.full_name || "ไม่มีชื่อ"} {isThisMe && "(คุณ)"}
                                    </ListGroup.ItemTitle>

                                    {/* ถ้าคนนี้เป็นแอดมิน ให้โชว์มงกุฎข้างๆ ชื่อตลอดเวลา */}
                                    {isThisMemberAdmin && <Crown color="#eab308" size={16} />}
                                </View>
                                <ListGroup.ItemDescription className="font-noto text-xs text-gray-500">
                                    {member.email}
                                </ListGroup.ItemDescription>
                            </ListGroup.ItemContent>

                            {/* โซนขวาสุด (ItemSuffix) สำหรับปุ่ม Action */}
                            <ListGroup.ItemSuffix>
                                {/* เงื่อนไขการโชว์ปุ่ม:
                  1. ตัวเราต้องเป็นแอดมิน (isMeAdmin)
                  2. ต้องไม่ใช่ตัวเราเอง (ห้ามเตะตัวเอง ห้ามโอนให้ตัวเอง)
                */}
                                {isMeAdmin && !isThisMe ? (
                                    <View className="flex-row gap-4 items-center pl-2">
                                        {/* ปุ่มโอนแอดมิน */}
                                        <Pressable
                                            className="active:opacity-50"
                                            onPress={() => handleTransferAdmin(member.id, member.full_name)}
                                        >
                                            <Crown color="#3b82f6" size={22} />
                                        </Pressable>

                                        {/* ปุ่มเตะออก */}
                                        <Pressable
                                            className="active:opacity-50"
                                            onPress={() => handleKickMember(member.id, member.full_name)}
                                        >
                                            <UserMinus color="#ef4444" size={22} />
                                        </Pressable>
                                    </View>
                                ) : (
                                    // ถ้าไม่ใช่แอดมิน หรือเป็นตัวเอง ก็ไม่ต้องโชว์ปุ่มอะไร ปล่อยว่างไว้
                                    <View />
                                )}
                            </ListGroup.ItemSuffix>
                        </ListGroup.Item>
                    );
                })}
            </ListGroup>
        </ScrollView>
    );
}