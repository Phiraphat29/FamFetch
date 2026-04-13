import React, { useState } from "react";
import { View, Alert } from "react-native";
import { ListGroup } from "heroui-native";
import { Pencil, ShieldCheck, DoorOpen } from "lucide-react-native";
import EditFamDialog from "./dialog/EditFamDialog";
import { router } from "expo-router";

interface FamilySettingsMenuProps {
    family: any;
}

export default function FamilySettingsMenu({
    family,
}: FamilySettingsMenuProps) {

    const [isEditFamDialogOpen, setIsEditFamDialogOpen] = useState(false);

    const handleEditName = () => {
        setIsEditFamDialogOpen(true);
    };

    const handleViewMembers = () => {
        router.push({ pathname: '/dashboard/member' });
    };

    const handleLeaveFamily = () => {
        Alert.alert(
            "ยืนยันการออกจากครอบครัว",
            "แน่ใจนะว่าจะออกจากบ้านนี้? คุณจะไม่เห็นบิลและคลังสินค้าของบ้านนี้อีก",
            [
                { text: "ยกเลิก", style: "cancel" },
                {
                    text: "ออกจากบ้าน",
                    style: "destructive",
                    onPress: () => console.log("เตะออกจากบ้าน!"),
                },
            ],
        );
        // TODO: ยิง Supabase อัปเดต family_id ของตัวเองให้เป็น null
    };

    // prettier-ignore
    return (
        <>
            <View className="w-full mt-2"><ListGroup className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden">{[
                <ListGroup.Item key="edit" onPress={handleEditName}>{[
                    <ListGroup.ItemPrefix key="p"><View className="bg-blue-100 p-2 rounded-lg"><Pencil color="#2563eb" size={20} /></View></ListGroup.ItemPrefix>,
                    <ListGroup.ItemContent key="c">{[
                        <ListGroup.ItemTitle key="t" className="font-noto-bold text-base">แก้ไขชื่อครอบครัว</ListGroup.ItemTitle>,
                        <ListGroup.ItemDescription key="d" className="font-noto text-xs">เปลี่ยนชื่อบ้านให้จดจำง่ายขึ้น</ListGroup.ItemDescription>,
                    ]}</ListGroup.ItemContent>,
                    <ListGroup.ItemSuffix key="s" />,
                ]}</ListGroup.Item>,
                <ListGroup.Item key="admin" onPress={handleViewMembers}>{[
                    <ListGroup.ItemPrefix key="p"><View className="bg-amber-100 p-2 rounded-lg"><ShieldCheck color="#d97706" size={20} /></View></ListGroup.ItemPrefix>,
                    <ListGroup.ItemContent key="c">{[
                        <ListGroup.ItemTitle key="t" className="font-noto-bold text-base">ดูสมาชิกครอบครัว</ListGroup.ItemTitle>,
                        <ListGroup.ItemDescription key="d" className="font-noto text-xs">ดูสมาชิกครอบครัวและจัดการสิทธิ์</ListGroup.ItemDescription>,
                    ]}</ListGroup.ItemContent>,
                    <ListGroup.ItemSuffix key="s" />,
                ]}</ListGroup.Item>,
                <ListGroup.Item key="leave" onPress={handleLeaveFamily}>{[
                    <ListGroup.ItemPrefix key="p"><View className="bg-red-100 p-2 rounded-lg"><DoorOpen color="#dc2626" size={20} /></View></ListGroup.ItemPrefix>,
                    <ListGroup.ItemContent key="c">{[
                        <ListGroup.ItemTitle key="t" className="font-noto-bold text-base text-red-600">ออกจากครอบครัว</ListGroup.ItemTitle>,
                        <ListGroup.ItemDescription key="d" className="font-noto text-xs text-red-400">ลบตัวเองออกจากบ้านหลังนี้</ListGroup.ItemDescription>,
                    ]}</ListGroup.ItemContent>,
                ]}</ListGroup.Item>,
            ]}</ListGroup>
            </View>

            <EditFamDialog
                isOpen={isEditFamDialogOpen}
                onOpenChange={setIsEditFamDialogOpen}
                familyName={family?.name}
                familyId={family?.id}
                profile={family?.profile}
            />
        </>
    );
}
