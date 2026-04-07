import { Text, KeyboardAvoidingView, Alert } from 'react-native'
import { useState } from 'react'
import { Dialog, Button, Input, Toast, useToast } from 'heroui-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

interface EditFamDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    familyName: string;
    profile: any;
}

export default function EditFamDialog({ isOpen, onOpenChange, familyName, profile }: EditFamDialogProps) {
    const [name, setName] = useState(familyName);
    const { toast } = useToast();

    const handleEditFamily = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error: familyError } = await supabase
                .from('families')
                .update({ name: name })
                .eq('id', profile.family_id);

            if (familyError) throw familyError;

            toast.show({
                label: 'สำเร็จ',
                description: 'ชื่อครอบครัวได้ถูกแก้ไขเรียบร้อย',
                variant: 'success',
            });
            onOpenChange(false);
            router.replace('/dashboard');
        } catch (error: any) {
            toast.show({
                label: 'เกิดข้อผิดพลาด',
                description: error.message,
                variant: 'danger',
            });
        }
    };

    return (
        <Dialog isOpen={isOpen} onOpenChange={onOpenChange} className="w-full">
            <Dialog.Portal>
                <Dialog.Overlay />
                <KeyboardAvoidingView behavior="padding">
                    <Dialog.Content>
                        <Dialog.Close />
                        <Dialog.Title className="text-black font-noto-bold text-xl mt-4">แก้ไขชื่อครอบครัว</Dialog.Title>
                        <Dialog.Description className="text-black font-noto text-sm mb-4">กรุณากรอกชื่อครอบครัวใหม่ของคุณ</Dialog.Description>
                        <Input
                            className="border border-zinc-400 p-4 mb-2"
                            placeholder="ชื่อครอบครัวใหม่"
                            value={name}
                            onChangeText={setName}
                        />
                        <Button variant="primary" onPress={handleEditFamily} className="w-full flex-row items-center justify-center rounded-full mt-4">
                            <Text className="text-white font-noto-bold text-lg ml-3">บันทึก</Text>
                        </Button>
                    </Dialog.Content>
                </KeyboardAvoidingView>
            </Dialog.Portal>
        </Dialog>
    )
}