import React, { useState } from "react";
import { View, Text, Image, Pressable, } from "react-native";
import { Button, Popover } from "heroui-native";
import { ChevronDown, LogOut, Settings } from "lucide-react-native";
import LogoutDialog from "./dialog/LogoutDialog";
import EditFamDialog from "./dialog/EditFamDialog";

interface ProfileHeaderProps {
    profile: any;
    family: any;
}

export default function ProfileHeader({ profile, family }: ProfileHeaderProps) {
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const [isEditFamDialogOpen, setIsEditFamDialogOpen] = useState(false);

    return (
        <View className="mb-8 mt-8 w-full items-center">
            <Popover>
                <Popover.Trigger asChild>
                    <Pressable className="flex-row items-center gap-3">
                        {profile?.avatar_url ? (
                            <Image
                                source={{ uri: profile.avatar_url }}
                                className="w-12 h-12 rounded-full border-2 border-gray-200"
                            />
                        ) : (
                            <View className="w-12 h-12 rounded-full bg-gray-300" />
                        )}
                        <View>
                            <Text className="text-lg font-noto-bold text-black dark:text-white">
                                {profile?.full_name || "ผู้ใช้งาน"}
                            </Text>
                            <Text className="text-sm font-noto text-gray-500">
                                ครอบครัว: {family?.name || "กำลังโหลด..."}
                            </Text>
                        </View>
                        <ChevronDown color="#9ca3af" size={20} />
                    </Pressable>
                </Popover.Trigger>

                <Popover.Portal>
                    <Popover.Overlay />
                    <Popover.Content
                        presentation="popover"
                        width={280}
                        placement="bottom"
                        align="center"
                        className="rounded-xl p-5 border border-gray-200 bg-white shadow-lg"
                    >
                        <Popover.Close className="absolute top-3 right-3 z-50" />

                        <Popover.Title className="text-lg font-bold mb-3">ข้อมูลบัญชี</Popover.Title>

                        <View className="mb-3">
                            <Text className="text-xs text-gray-500">อีเมล</Text>
                            <Text className="text-sm font-noto text-black">
                                {profile?.email || "ไม่ระบุอีเมล"}
                            </Text>
                        </View>

                        <View className="mb-5">
                            <Text className="text-xs text-gray-500">รหัสเชิญครอบครัว (ให้รูมเมท/คนในบ้าน)</Text>
                            <View className="bg-gray-100 p-2 mt-1 rounded-lg">
                                <Text className="text-base font-noto-bold text-center text-black tracking-widest">
                                    {family?.invite_code || "-"}
                                </Text>
                            </View>
                        </View>

                        <Button
                            className="w-full bg-gray-100 mb-2"
                            onPress={() => setIsEditFamDialogOpen(true)}
                        >
                            <View className="flex-row items-center justify-center gap-2">
                                <Settings color="black" size={18} />
                                <Text className="text-black font-noto-bold">ตั้งค่าครอบครัว</Text>
                            </View>
                        </Button>

                        <Button
                            variant="secondary"
                            className="w-full bg-red-50 border border-red-200"
                            onPress={() => setIsLogoutDialogOpen(true)}
                        >
                            <View className="flex-row items-center justify-center gap-2">
                                <LogOut color="red" size={18} />
                                <Text className="text-red-600 font-noto-bold">ออกจากระบบ</Text>
                            </View>
                        </Button>

                    </Popover.Content>
                </Popover.Portal>
            </Popover>

            <EditFamDialog isOpen={isEditFamDialogOpen} onOpenChange={setIsEditFamDialogOpen} familyName={family?.name} profile={profile} />
            <LogoutDialog isOpen={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen} />

        </View>
    );
}