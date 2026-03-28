import { View, Text, Pressable, Alert } from 'react-native'
import { InputGroup, Button } from 'heroui-native'
import { Eye } from 'lucide-react-native'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { router } from 'expo-router'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const handleLogin = async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })
        if (error) {
            Alert.alert('เข้าสู่ระบบไม่สำเร็จ', error.message, [
                { text: 'ตกลง' }
            ])
        } else {
            router.replace('/')
        }
    }

    return (
        <View className="flex-1 items-center justify-center dark:bg-black font-noto px-[5%] gap-4">
            <Text className="text-2xl font-noto-bold text-black dark:text-white">เข้าสู่ระบบ</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-10 font-noto">กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ</Text>
            <InputGroup className="w-full">
                <InputGroup.Input placeholder="อีเมล" value={email} onChangeText={setEmail} />
            </InputGroup>
            <InputGroup className="w-full">
                <InputGroup.Input placeholder="รหัสผ่าน" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
                <InputGroup.Suffix>
                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                        <Eye className="w-4 h-4" />
                    </Pressable>
                </InputGroup.Suffix>
            </InputGroup>
            <Button className="w-full mt-4" onPress={handleLogin}>
                <Button.Label className="font-noto-bold">เข้าสู่ระบบ</Button.Label>
            </Button>
        </View>
    )
}