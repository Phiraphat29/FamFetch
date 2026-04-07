import { View, Text, KeyboardAvoidingView, } from 'react-native'
import React from 'react'
import { Dialog, Button } from 'heroui-native'
import { LogOut } from 'lucide-react-native'
import { supabase } from '../../lib/supabase';

interface LogoutDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function LogoutDialog({ isOpen, onOpenChange }: LogoutDialogProps) {
    const handleLogout = () => {
        supabase.auth.signOut();
        onOpenChange(false);
    }
    return (
        <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <KeyboardAvoidingView behavior="padding">
                    <Dialog.Content>
                        <Dialog.Close />
                        <Dialog.Title className="text-black font-noto-bold text-xl mt-4">ออกจากระบบ</Dialog.Title>
                        <Dialog.Description className="text-black font-noto text-sm mb-4">คุณต้องการออกจากระบบหรือไม่?</Dialog.Description>
                        <Button variant="primary" className="w-full flex-row items-center justify-center bg-red-500 rounded-full mt-4" onPress={handleLogout}>
                            <Text className="text-white font-noto-bold text-lg ml-3">ออกจากระบบ</Text>
                        </Button>
                    </Dialog.Content>
                </KeyboardAvoidingView>
            </Dialog.Portal>
        </Dialog>
    )
}