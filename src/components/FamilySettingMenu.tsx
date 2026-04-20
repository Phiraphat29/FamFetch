import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { ListGroup } from "heroui-native";
import { Pencil, ShieldCheck, DoorOpen } from "lucide-react-native";
import EditFamDialog from "./dialog/EditFamDialog";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import LeaveFamilyDialog from "./dialog/LeaveFamilyDialog";
import WarningDialog from "./dialog/WarningDialog";

interface FamilySettingsMenuProps {
    family: any;
}

export default function FamilySettingsMenu({
    family,
}: FamilySettingsMenuProps) {

    const [isEditFamDialogOpen, setIsEditFamDialogOpen] = useState(false);
    const [isLeaveFamilyDialogOpen, setIsLeaveFamilyDialogOpen] = useState(false);
    const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);
    const [warningDescription, setWarningDescription] = useState("");
    const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
    const [canDeleteFamilyOnLeave, setCanDeleteFamilyOnLeave] = useState(false);

    const checkAdminStatus = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !family?.id) return false;

            const { data: familyData, error } = await supabase
                .from("families")
                .select("admin_id")
                .eq("id", family.id)
                .single();

            if (error) throw error;
            const isAdmin = session.user.id === familyData?.admin_id;
            setIsCurrentUserAdmin(isAdmin);
            return isAdmin;

        } catch (error) {
            console.error(error);
            setIsCurrentUserAdmin(false);
            return false;
        }
    };

    useEffect(() => {
        checkAdminStatus();
    }, [family?.id]);

    const handleEditName = async () => {
        const isAdmin = await checkAdminStatus();
        if (!isAdmin) {
            setWarningDescription("เฉพาะแอดมินเท่านั้นที่สามารถแก้ไขชื่อครอบครัวได้");
            setIsWarningDialogOpen(true);
            return;
        }
        setIsEditFamDialogOpen(true);
    };

    const handleViewMembers = () => {
        router.push({ pathname: '/dashboard/member' });
    };

    const handleLeaveFamily = async () => {
        try {
            const isAdmin = await checkAdminStatus();
            setCanDeleteFamilyOnLeave(false);

            if (isAdmin) {
                const { count, error: countError } = await supabase
                    .from("profiles")
                    .select("id", { count: "exact", head: true })
                    .eq("family_id", family?.id);

                if (countError) throw countError;

                if ((count ?? 0) <= 1) {
                    setCanDeleteFamilyOnLeave(true);
                    setIsLeaveFamilyDialogOpen(true);
                    return;
                }

                setWarningDescription("แอดมินไม่สามารถออกจากครอบครัวได้ กรุณาโอนสิทธิ์แอดมินให้สมาชิกคนอื่นก่อน");
                setIsWarningDialogOpen(true);
                return;
            }

            setIsLeaveFamilyDialogOpen(true);
        } catch (error) {
            console.error(error);
            setWarningDescription("ไม่สามารถตรวจสอบสถานะครอบครัวได้ กรุณาลองใหม่อีกครั้ง");
            setIsWarningDialogOpen(true);
        }
    };

    const confirmLeaveFamily = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase
                .from("profiles")
                .update({ family_id: null })
                .eq("id", session.user.id);

            if (error) throw error;

            if (canDeleteFamilyOnLeave && family?.id) {
                const { error: deleteFamilyError } = await supabase
                    .from("families")
                    .delete()
                    .eq("id", family.id);

                if (deleteFamilyError) throw deleteFamilyError;
            }

            router.replace("/create-family");
        } catch (error) {
            console.error(error);
        }
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
            <LeaveFamilyDialog
                isOpen={isLeaveFamilyDialogOpen}
                onOpenChange={setIsLeaveFamilyDialogOpen}
                onConfirm={confirmLeaveFamily}
                familyId={family?.id}
            />
            <WarningDialog
                isOpen={isWarningDialogOpen}
                onOpenChange={setIsWarningDialogOpen}
                description={warningDescription}
            />
        </>
    );
}
