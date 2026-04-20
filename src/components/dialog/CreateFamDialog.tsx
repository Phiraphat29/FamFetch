import { Text, KeyboardAvoidingView, Alert } from 'react-native'
import { useState } from 'react'
import { Dialog, Button, Input } from 'heroui-native';
import { PlusIcon } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

type CreateFamDialogProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateFamDialog({ isOpen, onOpenChange }: CreateFamDialogProps) {
    const [name, setName] = useState('');

    const generateInviteCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const handleCreateFamily = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const inviteCode = generateInviteCode();

            const { data: familyData, error: familyError } = await supabase
                .from('families')
                .insert({ name: name, invite_code: inviteCode, admin_id: session.user.id })
                .select()
                .single();

            if (familyError) throw familyError;

            const { error: profileError } = await supabase
                .from('profiles')
                .update({ family_id: familyData.id })
                .eq('id', session.user.id);

            if (profileError) throw profileError;

            Alert.alert('สำเร็จ! 🎉', `สร้างครอบครัวเรียบร้อย รหัสเชิญของคุณคือ: ${inviteCode}`);
            router.replace('/dashboard');

        } catch (error: any) {
            Alert.alert('เกิดข้อผิดพลาด', error.message);
        }
    };

    return (
        <Dialog isOpen={isOpen} onOpenChange={onOpenChange} className="w-full">
            <Dialog.Trigger asChild>
                <Button variant="primary" className="w-full flex-row items-center justify-center bg-white border border-zinc-700 rounded-full mt-4" size="lg">
                    <PlusIcon size={24} color="#000" />
                    <Text className="text-black font-noto-bold text-lg ml-3">สร้างครอบครัว</Text>
                </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay />
                <KeyboardAvoidingView behavior="padding">
                    <Dialog.Content>
                        <Dialog.Close />
                        <Dialog.Title className="text-black font-noto-bold text-xl mt-4">สร้างครอบครัว</Dialog.Title>
                        <Dialog.Description className="text-black font-noto text-sm mb-4">กรุณากรอกข้อมูลครอบครัวของคุณ</Dialog.Description>
                        <Input
                            className="border border-zinc-400 p-4 mb-2 font-noto"
                            placeholder="ชื่อครอบครัว"
                            value={name}
                            onChangeText={setName}
                        />
                        <Button variant="primary" onPress={handleCreateFamily} className="w-full flex-row items-center justify-center rounded-full mt-4">
                            <Text className="text-white font-noto-bold text-lg ml-3">สร้างครอบครัว</Text>
                        </Button>
                    </Dialog.Content>
                </KeyboardAvoidingView>
            </Dialog.Portal>
        </Dialog>
    )
}