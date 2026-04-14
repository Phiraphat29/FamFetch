import React from "react";
import { KeyboardAvoidingView, Text } from "react-native";
import { Button, Dialog } from "heroui-native";

interface WarningDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    description: string;
}

export default function WarningDialog({
    isOpen,
    onOpenChange,
    description,
}: WarningDialogProps) {
    return (
        <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <KeyboardAvoidingView behavior="padding">
                    <Dialog.Content>
                        <Dialog.Close />
                        <Dialog.Title className="text-black font-noto-bold text-xl mt-4">
                            แจ้งเตือน
                        </Dialog.Title>
                        <Dialog.Description className="text-black font-noto text-sm mb-4">
                            {description}
                        </Dialog.Description>
                        <Button
                            variant="primary"
                            className="w-full flex-row items-center justify-center rounded-full mt-4"
                            onPress={() => onOpenChange(false)}
                        >
                            <Text className="text-white font-noto-bold text-lg">
                                Okay
                            </Text>
                        </Button>
                    </Dialog.Content>
                </KeyboardAvoidingView>
            </Dialog.Portal>
        </Dialog>
    );
}
