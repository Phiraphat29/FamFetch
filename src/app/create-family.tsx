import { View, Text } from 'react-native'
import React, { useState } from 'react'
import CreateFamDialog from '../components/dialog/CreateFamDialog'
import JoinFamDialog from '../components/dialog/JoinFamDialog'

export default function CreateFamily() {
    const [isCreateFamDialogOpen, setIsCreateFamDialogOpen] = useState(false);
    const [isJoinFamDialogOpen, setIsJoinFamDialogOpen] = useState(false);

    return (
        <View className="flex-1 items-center justify-center p-8 bg-white dark:bg-black">
            <View className="w-full max-w-md self-stretch">
                <Text className="text-2xl font-noto-bold text-center mb-5 text-black dark:text-white">
                    ดูเหมือนคุณจะยังไม่ได้เข้าร่วมครอบครัวนะ
                </Text>
                <CreateFamDialog isOpen={isCreateFamDialogOpen} onOpenChange={setIsCreateFamDialogOpen} />
                <JoinFamDialog isOpen={isJoinFamDialogOpen} onOpenChange={setIsJoinFamDialogOpen} />
            </View>
        </View>
    )
}