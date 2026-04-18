import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Button, Dialog, Input, ListGroup } from "heroui-native";
import { CalendarDays, CheckCircle2, CircleDashed, Pencil, Plus, Trash2 } from "lucide-react-native";
import { supabase } from "../../../lib/supabase";

type ShoppingTrip = {
  id: string;
  family_id: string;
  title: string;
  is_completed: boolean | null;
  created_at: string;
};

export default function ShoppingTripsOverviewScreen() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [trips, setTrips] = useState<ShoppingTrip[]>([]);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<ShoppingTrip | null>(null);

  const fetchTrips = useCallback(async () => {
    try {
      setErrorMessage(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setErrorMessage("Session expired. Please sign in again.");
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("family_id")
        .eq("id", session.user.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData?.family_id) {
        setTrips([]);
        setFamilyId(null);
        setErrorMessage("No family is linked to your profile.");
        setLoading(false);
        return;
      }

      setFamilyId(profileData.family_id);

      const { data, error } = await supabase
        .from("shopping_lists")
        .select("id,family_id,title,is_completed,created_at")
        .eq("family_id", profileData.family_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTrips((data ?? []) as ShoppingTrip[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch shopping trips.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const summaryLabel = useMemo(() => `${trips.length} trips`, [trips.length]);

  const createTrip = async () => {
    if (!familyId) return;
    if (!titleInput.trim()) {
      Alert.alert("Missing trip name", "Please enter a trip title.");
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from("shopping_lists").insert({
        family_id: familyId,
        title: titleInput.trim(),
      });
      if (error) throw error;

      setIsCreateDialogOpen(false);
      setTitleInput("");
      await fetchTrips();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create trip.";
      Alert.alert("Create failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (trip: ShoppingTrip) => {
    setSelectedTrip(trip);
    setTitleInput(trip.title);
    setIsEditDialogOpen(true);
  };

  const updateTrip = async () => {
    if (!selectedTrip || !familyId) return;
    if (!titleInput.trim()) {
      Alert.alert("Missing trip name", "Please enter a trip title.");
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("shopping_lists")
        .update({ title: titleInput.trim() })
        .eq("id", selectedTrip.id)
        .eq("family_id", familyId);
      if (error) throw error;

      setIsEditDialogOpen(false);
      setSelectedTrip(null);
      setTitleInput("");
      await fetchTrips();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update trip.";
      Alert.alert("Update failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  const removeTrip = (trip: ShoppingTrip) => {
    Alert.alert("Delete trip", `Delete "${trip.title}" and all item entries in it?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (!familyId) return;
            const { error } = await supabase
              .from("shopping_lists")
              .delete()
              .eq("id", trip.id)
              .eq("family_id", familyId);
            if (error) throw error;
            await fetchTrips();
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete trip.";
            Alert.alert("Delete failed", message);
          }
        },
      },
    ]);
  };

  const toggleCompleted = async (trip: ShoppingTrip) => {
    try {
      if (!familyId) return;
      const { error } = await supabase
        .from("shopping_lists")
        .update({ is_completed: !trip.is_completed })
        .eq("id", trip.id)
        .eq("family_id", familyId);
      if (error) throw error;
      await fetchTrips();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update status.";
      Alert.alert("Update failed", message);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <ActivityIndicator size="large" color="#111827" />
        <Text className="mt-3 text-sm text-gray-600 dark:text-zinc-300 font-noto">กำลังโหลดรายการซื้อของ...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
      <ScrollView className="flex-1 px-4 pt-5">
        <View className="mb-5 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-2xl text-black dark:text-white font-noto-bold">รายการซื้อของครอบครัว</Text>
            <Text className="mt-1 text-sm text-gray-600 dark:text-zinc-300 font-noto">
              สร้างและจัดการรายการซื้อของครอบครัว
            </Text>
            <Text className="mt-1 text-xs text-gray-500 dark:text-zinc-400 font-noto">{summaryLabel}</Text>
          </View>
          <Button
            variant="primary"
            className="rounded-full px-4 py-2"
            onPress={() => {
              setTitleInput("");
              setIsCreateDialogOpen(true);
            }}
            isDisabled={!familyId || submitting}
          >
            <View className="flex-row items-center">
              <Plus color="#fff" size={16} />
              <Text className="ml-2 text-sm text-white font-noto-bold">เพิ่ม</Text>
            </View>
          </Button>
        </View>

        {errorMessage ? (
          <View className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
            <Text className="text-sm text-red-700 dark:text-red-300 font-noto">{errorMessage}</Text>
            <Button variant="secondary" className="mt-3 rounded-full border border-red-300" onPress={fetchTrips}>
              <Text className="text-sm text-red-700 font-noto-bold">ลองใหม่</Text>
            </Button>
          </View>
        ) : null}

        <ListGroup className="rounded-2xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 overflow-hidden">
          {trips.length === 0 ? (
            <View className="items-center p-6">
              <CalendarDays color="#9ca3af" size={24} />
              <Text className="mt-2 text-sm text-gray-500 dark:text-zinc-400 font-noto">
                ยังไม่มีรายการซื้อของ
              </Text>
            </View>
          ) : (
            trips.map((trip) => (
              <ListGroup.Item key={trip.id} onPress={() => router.push(`/dashboard/shopping/${trip.id}`)}>
                <ListGroup.ItemPrefix>
                  {trip.is_completed ? <CheckCircle2 color="#16a34a" size={18} /> : <CircleDashed color="#6b7280" size={18} />}
                </ListGroup.ItemPrefix>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle className="text-base text-black dark:text-white font-noto-bold">
                    {trip.title}
                  </ListGroup.ItemTitle>
                  <ListGroup.ItemDescription className="text-xs text-gray-500 dark:text-zinc-400 font-noto">
                    {new Date(trip.created_at).toLocaleDateString()} - {trip.is_completed ? "สำเร็จ" : "เปิด"}
                  </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                  <View className="flex-row items-center gap-1 pl-1">
                    <Button
                      variant="secondary"
                      className="h-9 w-9 min-w-0 rounded-full px-0"
                      onPress={() => toggleCompleted(trip)}
                    >
                      {trip.is_completed ? <CircleDashed color="#6b7280" size={18} /> : <CheckCircle2 color="#16a34a" size={18} />}
                    </Button>
                    <Button variant="secondary" className="h-9 w-9 min-w-0 rounded-full px-0" onPress={() => openEditDialog(trip)}>
                      <Pencil color="#2563eb" size={18} />
                    </Button>
                    <Button variant="secondary" className="h-9 w-9 min-w-0 rounded-full px-0" onPress={() => removeTrip(trip)}>
                      <Trash2 color="#dc2626" size={18} />
                    </Button>
                  </View>
                </ListGroup.ItemSuffix>
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      </ScrollView>

      <Dialog isOpen={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Close />
            <Dialog.Title className="mt-3 text-xl text-black font-noto-bold">สร้างรายการซื้อของ</Dialog.Title>
            <Dialog.Description className="mb-4 text-sm text-gray-600 font-noto">
              ตัวอย่าง: ซื้อของวันอาทิตย์ ที่ซูเปอร์มาร์เก็ต
            </Dialog.Description>
            <Input
              className="border border-gray-300 p-3"
              placeholder="ชื่อรายการซื้อของ"
              value={titleInput}
              onChangeText={setTitleInput}
            />
            <Button variant="primary" className="mt-4 rounded-full" isDisabled={submitting} onPress={createTrip}>
              <Text className="text-base text-white font-noto-bold">{submitting ? "กำลังสร้าง..." : "สร้างรายการซื้อของ"}</Text>
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Close />
            <Dialog.Title className="mt-3 text-xl text-black font-noto-bold">แก้ไขชื่อรายการซื้อของ</Dialog.Title>
            <Dialog.Description className="mb-4 text-sm text-gray-600 font-noto">
              คงชื่อรายการซื้อของให้สั้นและชัดเจนสำหรับครอบครัว
            </Dialog.Description>
            <Input
              className="border border-gray-300 p-3"
              placeholder="ชื่อรายการซื้อของ"
              value={titleInput}
              onChangeText={setTitleInput}
            />
            <Button variant="primary" className="mt-4 rounded-full" isDisabled={submitting} onPress={updateTrip}>
              <Text className="text-base text-white font-noto-bold">{submitting ? "บันทึก..." : "บันทึกการแก้ไข"}</Text>
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </View>
  );
}
