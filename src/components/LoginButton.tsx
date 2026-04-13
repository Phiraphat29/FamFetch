import { supabase } from "../lib/supabase";
import { makeRedirectUri } from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { Alert, Text } from "react-native";
import { Button, Toast, useToast } from "heroui-native";
import { Globe } from "lucide-react-native";

WebBrowser.maybeCompleteAuthSession();

export default function LoginButton() {
    const router = useRouter();
    const { toast } = useToast();

    const handleGoogleSignIn = async () => {
        try {
            const redirectUri = makeRedirectUri();
            console.log(redirectUri);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: redirectUri,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;

            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

                if (result.type === "success" && result.url) {

                    const returnUrl = result.url;

                    if (returnUrl.includes("access_token")) {
                        const paramsStr = returnUrl.includes("#") ? returnUrl.split("#")[1] : returnUrl.split("?")[1];
                        const urlParams = new URLSearchParams(paramsStr);
                        const access_token = urlParams.get("access_token");
                        const refresh_token = urlParams.get("refresh_token");

                        if (access_token && refresh_token) {
                            const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
                            if (sessionError) throw sessionError;

                            toast.show({
                                label: "สำเร็จ",
                                description: "เข้าสู่ระบบสำเร็จ",
                                variant: "success",
                            });
                            router.replace("/dashboard");
                        }
                    }
                    else if (returnUrl.includes("code=")) {
                        const paramsStr = returnUrl.includes("?") ? returnUrl.split("?")[1] : returnUrl.split("#")[1];
                        const urlParams = new URLSearchParams(paramsStr);
                        const code = urlParams.get("code");

                        if (code) {
                            const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
                            if (sessionError) throw sessionError;

                            toast.show({
                                label: "สำเร็จ",
                                description: "เข้าสู่ระบบสำเร็จ",
                                variant: "success",
                            });
                            router.replace("/dashboard");
                        }
                    }
                }
            }
        } catch (error: any) {
            console.error(error.message);
            Alert.alert("เกิดข้อผิดพลาด", error.message);
        }
    };

    return (
        <Button
            className="w-full flex-row items-center justify-center bg-white border border-gray-300 rounded-full"
            onPress={handleGoogleSignIn}
        >
            <Globe color="#000" size={24} />
            <Text className="text-black font-semibold text-lg ml-3">
                ดำเนินการต่อด้วย Google
            </Text>
        </Button>
    );
};
