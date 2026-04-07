import React, { useState } from "react";
import { View, Text, Image } from "react-native";
import LogoutDialog from "./dialog/LogoutDialog";

interface ProfileHeaderProps {
    profile: any;
    family: any;
}

export default function ProfileHeader({ profile, family }: ProfileHeaderProps) {
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

    return (
        <View className="flex-row justify-between items-center mb-8 mt-8">
            <View className="flex-row items-center gap-3">
                {profile?.avatar_url ? (
                    <Image
                        source={{ uri: profile.avatar_url }}
                        className="w-12 h-12 rounded-full border-2 border-gray-200"
                    />
                ) : (
                    <View className="w-12 h-12 rounded-full bg-gray-300" />
                )}
                <View>
                    <Text className="text-lg font-bold text-black dark:text-white">
                        {profile?.full_name || "ผู้ใช้งาน"}
                    </Text>
                    <Text className="text-sm text-gray-500">
                        บ้าน: {family?.name || "กำลังโหลด..."}
                    </Text>
                </View>
            </View>

            <LogoutDialog isOpen={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen} />
        </View>
    );
}