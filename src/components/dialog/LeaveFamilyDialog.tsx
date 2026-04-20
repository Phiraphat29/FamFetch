import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Text } from "react-native";
import { Button, Dialog } from "heroui-native";
import { supabase } from "../../lib/supabase";

type LeaveFamilyDialogProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    familyId?: string;
}

export default function LeaveFamilyDialog({
    isOpen,
    onOpenChange,
    onConfirm,
    familyId,
}: LeaveFamilyDialogProps) {
    const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

    useEffect(() => {
        const loadAdminState = async () => {
            try {
                if (!isOpen || !familyId) {
                    setIsCurrentUserAdmin(false);
                    return;
                }

                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    setIsCurrentUserAdmin(false);
                    return;
                }

                const { data: familyData, error } = await supabase
                    .from("families")
                    .select("admin_id")
                    .eq("id", familyId)
                    .single();

                if (error) throw error;
                setIsCurrentUserAdmin(familyData?.admin_id === session.user.id);
            } catch (error) {
                console.error(error);
                setIsCurrentUserAdmin(false);
            }
        };

        loadAdminState();
    }, [isOpen, familyId]);

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
                            {isCurrentUserAdmin
                                ? "คุณเป็นแอดมินของบ้านนี้ หากยืนยันออกจากครอบครัว บ้านนี้จะถูกลบถาวรพร้อมข้อมูลที่เกี่ยวข้อง"
                                : "แน่ใจนะว่าจะออกจากบ้านนี้? คุณจะไม่เห็นบิลและคลังสินค้าของบ้านนี้อีก"}
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
