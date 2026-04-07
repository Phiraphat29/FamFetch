import { View, Text, Image } from 'react-native'
import LoginButton from '../components/LoginButton'

export default function Login() {
    return (
        <View className="flex-1 items-center justify-center dark:bg-black font-noto px-[5%] gap-4">
            <Image source={require("../../assets/images/logo.png")} className="w-30 h-30" />
            <Text className="text-4xl font-noto-bold text-black dark:text-white">เข้าสู่ระบบ</Text>
            <Text className="text-xl text-gray-500 dark:text-gray-400 mb-10 font-noto">กรุณาเข้าสู่ระบบเพื่อเริ่มต้นการใช้งาน</Text>
            <LoginButton />
        </View>
    )
}