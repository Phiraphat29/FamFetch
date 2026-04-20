import { Text, KeyboardAvoidingView, Alert } from 'react-native'
import { useState } from 'react'
import { Dialog, Button, Input } from 'heroui-native';
import { PlusIcon } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

interface JoinFamDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function JoinFamDialog({ isOpen, onOpenChange }: JoinFamDialogProps) {
    const [inviteCode, setInviteCode] = useState('');

    const handleJoinFamily = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: familyData, error: familyError } = await supabase.from('families').select('*').eq('invite_code', inviteCode).single();
            if (familyError) throw familyError;
            if (!familyData) throw new Error('ครอบครัวไม่ถูกต้อง');

            const { error: profileError } = await supabase
                .from('profiles')
                .update({ family_id: familyData.id })
                .eq('id', session.user.id);
            if (profileError) throw profileError;

            Alert.alert('สำเร็จ! 🎉', `เข้าร่วมครอบครัว ${familyData.name} เรียบร้อย`);
            router.replace('/dashboard');

        } catch (error: any) {
            Alert.alert('เกิดข้อผิดพลาด', error.message);
        }
    }
    return (
        <Dialog isOpen={isOpen} onOpenChange={onOpenChange} className="w-full">
            <Dialog.Trigger asChild>
                <Button variant="primary" size="lg" className="w-full flex-row items-center justify-center bg-white border border-zinc-700 rounded-full mt-4">
                    <PlusIcon size={24} color="#000" />
                    <Text className="text-black font-noto-bold text-lg ml-3">เข้าร่วมครอบครัว</Text>
                </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay />
                <KeyboardAvoidingView behavior="padding">
                    <Dialog.Content>
                        <Dialog.Close />
                        <Dialog.Title className="text-black font-noto-bold text-xl mt-4">เข้าร่วมครอบครัว</Dialog.Title>
                        <Dialog.Description className="text-black font-noto text-sm mb-4">กรุณากรอกรหัสครอบครัวที่คุณต้องการจะเข้าร่วม</Dialog.Description>
                        <Input
                            className="border border-zinc-400 p-4 mb-2 font-noto"
                            placeholder="รหัสครอบครัว"
                            value={inviteCode}
                            onChangeText={(text) => setInviteCode(text.toUpperCase())}
                        />
                        <Button variant="primary" onPress={handleJoinFamily} className="w-full flex-row items-center justify-center rounded-full mt-4">
                            <Text className="text-white font-noto-bold text-lg ml-3">เข้าร่วมครอบครัว</Text>
                        </Button>
                    </Dialog.Content>
                </KeyboardAvoidingView>
            </Dialog.Portal>
        </Dialog>
    )
}