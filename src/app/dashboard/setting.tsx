import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import FamilySettingsMenu from "../../components/FamilySettingMenu";

function asParam(v: string | string[] | undefined): string {
    if (v === undefined) return "";
    return Array.isArray(v) ? (v[0] ?? "") : v;
}

export default function Setting() {
    const { familyId, familyName } = useLocalSearchParams<{
        familyId?: string | string[];
        familyName?: string | string[];
    }>();

    return (
        <View className="flex-1 p-6 bg-gray-50 dark:bg-zinc-900">
            <FamilySettingsMenu
                family={{
                    id: asParam(familyId),
                    name: asParam(familyName),
                }}
            />
        </View>
    );
}
