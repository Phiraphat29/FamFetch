import React from "react";
import { KeyboardAvoidingView, Text } from "react-native";
import { Button, Dialog } from "heroui-native";

interface KickMemberDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    targetUserName: string;
    onConfirm: () => void;
}

export default function KickMemberDialog({
    isOpen,
    onOpenChange,
    targetUserName,
    onConfirm,
}: KickMemberDialogProps) {
    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    return (
        <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <KeyboardAvoidingView behavior="padding">
                    <Dialog.Content>
                        <Dialog.Close />
                        <Dialog.Title className="text-black font-noto-bold text-xl mt-4">
                            เตะออกจากบ้าน 🚪
                        </Dialog.Title>
                        <Dialog.Description className="text-black font-noto text-sm mb-4">
                            ต้องการลบ {targetUserName} ออกจากครอบครัวใช่หรือไม่?
                        </Dialog.Description>
                        <Button
                            variant="primary"
                            className="w-full flex-row items-center justify-center bg-red-500 rounded-full mt-4"
                            onPress={handleConfirm}
                        >
                            <Text className="text-white font-noto-bold text-lg">
                                เตะออก
                            </Text>
                        </Button>
                    </Dialog.Content>
                </KeyboardAvoidingView>
            </Dialog.Portal>
        </Dialog>
    );
}
