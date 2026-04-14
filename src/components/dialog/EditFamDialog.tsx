import { Text, KeyboardAvoidingView } from 'react-native'
import { useEffect, useState } from 'react'
import { Dialog, Button, Input, useToast } from 'heroui-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import WarningDialog from './WarningDialog';

function asString(v: string | string[] | undefined): string {
    if (v === undefined) return '';
    return Array.isArray(v) ? (v[0] ?? '') : v;
}

interface EditFamDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    familyName: string | string[] | undefined;
    familyId?: string | string[];
    profile?: any;
}

export default function EditFamDialog({ isOpen, onOpenChange, familyName, familyId, profile }: EditFamDialogProps) {
    const [name, setName] = useState(() => asString(familyName));
    const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);
    const [warningDescription, setWarningDescription] = useState('');
    const { toast } = useToast();

    const resolvedFamilyId = asString(familyId) || profile?.family_id;

    useEffect(() => {
        if (isOpen) {
            setName(asString(familyName));
        }
    }, [isOpen, familyName]);

    const handleEditFamily = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            if (!resolvedFamilyId) {
                toast.show({
                    label: 'เกิดข้อผิดพลาด',
                    description: 'ไม่พบรหัสครอบครัว กรุณาเปิดหน้านี้จากเมนูครอบครัวอีกครั้ง',
                    variant: 'danger',
                });
                return;
            }

            const { data: familyData, error: familyFetchError } = await supabase
                .from('families')
                .select('admin_id')
                .eq('id', resolvedFamilyId)
                .single();

            if (familyFetchError) throw familyFetchError;

            if (familyData?.admin_id !== session.user.id) {
                setWarningDescription('เฉพาะแอดมินเท่านั้นที่สามารถแก้ไขชื่อครอบครัวได้');
                setIsWarningDialogOpen(true);
                return;
            }

            const { data: updatedFamily, error: familyError } = await supabase
                .from('families')
                .update({ name: name })
                .eq('id', resolvedFamilyId)
                .select('id')
                .maybeSingle();

            if (familyError) throw familyError;
            if (!updatedFamily) {
                setWarningDescription('ไม่สามารถแก้ไขชื่อครอบครัวได้ กรุณาตรวจสอบสิทธิ์ของคุณอีกครั้ง');
                setIsWarningDialogOpen(true);
                return;
            }

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
        <>
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
            <WarningDialog
                isOpen={isWarningDialogOpen}
                onOpenChange={setIsWarningDialogOpen}
                description={warningDescription}
            />
        </>
    )
}