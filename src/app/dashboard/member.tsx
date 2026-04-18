import React, { useEffect, useState } from "react";
import { View, ScrollView, ActivityIndicator, Pressable, Image, Text } from "react-native";
import { ListGroup } from "heroui-native";
import { Crown, UserMinus } from "lucide-react-native";
import { supabase } from "../../lib/supabase";
import TransferAdminDialog from "../../components/dialog/TransferAdminDialog";
import KickMemberDialog from "../../components/dialog/KickMemberDialog";
import WarningDialog from "../../components/dialog/WarningDialog";

export default function FamilyMembersScreen() {
    const [members, setMembers] = useState<any[]>([]);
    const [family, setFamily] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<{ id: string; name: string } | null>(null);
    const [isTransferAdminDialogOpen, setIsTransferAdminDialogOpen] = useState(false);
    const [isKickMemberDialogOpen, setIsKickMemberDialogOpen] = useState(false);
    const [warningMessage, setWarningMessage] = useState("");
    const [isWarningOpen, setIsWarningOpen] = useState(false);

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

            const { data: familyData } = await supabase
                .from("families")
                .select("*")
                .eq("id", myProfile.family_id)
                .single();
            setFamily(familyData);

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

    const isMeAdmin = currentUser?.id === family?.admin_id;

    const handleTransferAdmin = (targetUserId: string, targetUserName: string) => {
        setSelectedMember({ id: targetUserId, name: targetUserName || "สมาชิก" });
        setIsTransferAdminDialogOpen(true);
    };

    const handleKickMember = (targetUserId: string, targetUserName: string) => {
        setSelectedMember({ id: targetUserId, name: targetUserName || "สมาชิก" });
        setIsKickMemberDialogOpen(true);
    };

    const confirmTransferAdmin = async () => {
        try {
            if (!selectedMember || !family?.id) return;
            const { error: familyError } = await supabase
                .from("families")
                .update({ admin_id: selectedMember.id })
                .eq("id", family.id);
            if (familyError) throw familyError;
            setIsTransferAdminDialogOpen(false);
            await fetchMembers();
        } catch (error: any) {
            setWarningMessage(error?.message || "ไม่สามารถโอนสิทธิ์แอดมินได้");
            setIsWarningOpen(true);
        }
    };

    const confirmKickMember = async () => {
        try {
            if (!selectedMember) return;
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ family_id: null })
                .eq("id", selectedMember.id);
            if (profileError) throw profileError;
            setIsKickMemberDialogOpen(false);
            await fetchMembers();
        } catch (error: any) {
            setWarningMessage(error?.message || "ไม่สามารถเตะสมาชิกออกได้");
            setIsWarningOpen(true);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-zinc-900">
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
            <ScrollView className="flex-1 p-4">
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
                                    {isMeAdmin && !isThisMe ? (
                                        <View className="flex-row gap-4 items-center pl-2">
                                            <Pressable
                                                className="active:opacity-50"
                                                onPress={() => handleTransferAdmin(member.id, member.full_name)}
                                            >
                                                <Crown color="#3b82f6" size={22} />
                                            </Pressable>

                                            <Pressable
                                                className="active:opacity-50"
                                                onPress={() => handleKickMember(member.id, member.full_name)}
                                            >
                                                <UserMinus color="#ef4444" size={22} />
                                            </Pressable>
                                        </View>
                                    ) : (
                                        <View />
                                    )}
                                </ListGroup.ItemSuffix>
                            </ListGroup.Item>
                        );
                    })}
                </ListGroup>
            </ScrollView>

            <TransferAdminDialog
                isOpen={isTransferAdminDialogOpen}
                onOpenChange={setIsTransferAdminDialogOpen}
                targetUserName={selectedMember?.name || "สมาชิก"}
                onConfirm={confirmTransferAdmin}
            />
            <KickMemberDialog
                isOpen={isKickMemberDialogOpen}
                onOpenChange={setIsKickMemberDialogOpen}
                targetUserName={selectedMember?.name || "สมาชิก"}
                onConfirm={confirmKickMember}
            />
            <WarningDialog
                isOpen={isWarningOpen}
                onOpenChange={setIsWarningOpen}
                description={warningMessage}
            />
        </View>
    );
}