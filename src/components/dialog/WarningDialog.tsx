import React from "react";
import { KeyboardAvoidingView, Text } from "react-native";
import { Button, Dialog } from "heroui-native";

interface WarningDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    description: string;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void | Promise<void>;
    isConfirming?: boolean;
    tone?: "default" | "danger";
}

export default function WarningDialog({
    isOpen,
    onOpenChange,
    description,
    title = "แจ้งเตือน",
    confirmText = "ตกลง",
    cancelText,
    onConfirm,
    isConfirming = false,
    tone = "default",
}: WarningDialogProps) {
    const confirmButtonClassName =
        tone === "danger"
            ? "w-full flex-row items-center justify-center rounded-full mt-4 bg-red-600"
            : "w-full flex-row items-center justify-center rounded-full mt-4";

    return (
        <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <KeyboardAvoidingView behavior="padding">
                    <Dialog.Content>
                        <Dialog.Close />
                        <Dialog.Title className="text-black font-noto-bold text-xl mt-4">{title}</Dialog.Title>
                        <Dialog.Description className="text-black font-noto text-sm mb-4">
                            {description}
                        </Dialog.Description>
                        {cancelText && onConfirm ? (
                            <>
                                <Button
                                    variant="secondary"
                                    className="w-full flex-row items-center justify-center rounded-full mt-2"
                                    onPress={() => onOpenChange(false)}
                                    isDisabled={isConfirming}
                                >
                                    <Text className="text-black font-noto-bold text-lg">{cancelText}</Text>
                                </Button>
                                <Button
                                    variant="primary"
                                    className={confirmButtonClassName}
                                    onPress={() => {
                                        void onConfirm();
                                    }}
                                    isDisabled={isConfirming}
                                >
                                    <Text className="text-white font-noto-bold text-lg">
                                        {isConfirming ? "กำลังดำเนินการ..." : confirmText}
                                    </Text>
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="primary"
                                className={confirmButtonClassName}
                                onPress={() => onOpenChange(false)}
                            >
                                <Text className="text-white font-noto-bold text-lg">{confirmText}</Text>
                            </Button>
                        )}
                    </Dialog.Content>
                </KeyboardAvoidingView>
            </Dialog.Portal>
        </Dialog>
    );
}
