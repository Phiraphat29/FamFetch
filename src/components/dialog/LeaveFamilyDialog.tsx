import React from "react";
import { KeyboardAvoidingView, Text } from "react-native";
import { Button, Dialog } from "heroui-native";

interface LeaveFamilyDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

export default function LeaveFamilyDialog({
    isOpen,
    onOpenChange,
    onConfirm,
}: LeaveFamilyDialogProps) {
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
                            ยืนยันการออกจากครอบครัว
                        </Dialog.Title>
                        <Dialog.Description className="text-black font-noto text-sm mb-4">
                            แน่ใจนะว่าจะออกจากบ้านนี้? คุณจะไม่เห็นบิลและคลังสินค้าของบ้านนี้อีก
                        </Dialog.Description>
                        <Button
                            variant="primary"
                            className="w-full flex-row items-center justify-center bg-red-500 rounded-full mt-4"
                            onPress={handleConfirm}
                        >
                            <Text className="text-white font-noto-bold text-lg">
                                ออกจากบ้าน
                            </Text>
                        </Button>
                    </Dialog.Content>
                </KeyboardAvoidingView>
            </Dialog.Portal>
        </Dialog>
    );
}
