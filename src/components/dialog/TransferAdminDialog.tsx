import React from "react";
import { KeyboardAvoidingView, Text } from "react-native";
import { Button, Dialog } from "heroui-native";

type TransferAdminDialogProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    targetUserName: string;
    onConfirm: () => void;
}

export default function TransferAdminDialog({
    isOpen,
    onOpenChange,
    targetUserName,
    onConfirm,
}: TransferAdminDialogProps) {
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
                            มอบมงกุฎหัวหน้าครอบครัว 👑
                        </Dialog.Title>
                        <Dialog.Description className="text-black font-noto text-sm mb-4">
                            แน่ใจนะว่าจะยกตำแหน่งแอดมินให้ {targetUserName}? คุณจะกลายเป็นสมาชิกธรรมดาทันที
                        </Dialog.Description>
                        <Button
                            variant="primary"
                            className="w-full flex-row items-center justify-center bg-blue-500 rounded-full mt-4"
                            onPress={handleConfirm}
                        >
                            <Text className="text-white font-noto-bold text-lg">
                                มอบตำแหน่ง
                            </Text>
                        </Button>
                    </Dialog.Content>
                </KeyboardAvoidingView>
            </Dialog.Portal>
        </Dialog>
    );
}
