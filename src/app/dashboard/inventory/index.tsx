import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Button, Dialog, Input, ListGroup } from "heroui-native";
import { Package, Pencil, Plus, Tag, Trash2 } from "lucide-react-native";
import { supabase } from "../../../lib/supabase";

type InventoryItem = {
  id: string;
  family_id: string;
  name: string;
  category: string | null;
  created_at: string;
};

type ItemForm = {
  name: string;
  category: string;
};

const EMPTY_FORM: ItemForm = { name: "", category: "" };

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<ItemForm>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<ItemForm>(EMPTY_FORM);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const itemCountLabel = useMemo(() => `${items.length} templates`, [items.length]);

  const fetchInventory = useCallback(async () => {
    try {
      setErrorMessage(null);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        setErrorMessage("การลงชื่อเข้าใช้งานหมดอายุ กรุณาลงชื่อเข้าใช้งานใหม่");
        setLoading(false);
        return;
      }

      setCurrentUserId(session.user.id);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("family_id")
        .eq("id", session.user.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData?.family_id) {
        setFamilyId(null);
        setItems([]);
        setErrorMessage("ไม่พบครอบครัวของคุณ");
        setLoading(false);
        return;
      }

      setFamilyId(profileData.family_id);

      const { data: itemRows, error: itemError } = await supabase
        .from("items")
        .select("id,family_id,name,category,created_at")
        .eq("family_id", profileData.family_id)
        .order("created_at", { ascending: false });

      if (itemError) throw itemError;
      setItems((itemRows ?? []) as InventoryItem[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load inventory.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const onCreateItem = async () => {
    if (!familyId) return;
    if (!createForm.name.trim()) {
      Alert.alert("ไม่พบชื่อสินค้า", "กรุณากรอกชื่อสินค้า");
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from("items").insert({
        family_id: familyId,
        name: createForm.name.trim(),
        category: createForm.category.trim() || null,
      });
      if (error) throw error;

      setIsCreateDialogOpen(false);
      setCreateForm(EMPTY_FORM);
      await fetchInventory();
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถเพิ่มสินค้าได้";
      Alert.alert("ไม่สามารถเพิ่มสินค้าได้", message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditForm({ name: item.name, category: item.category ?? "" });
    setIsEditDialogOpen(true);
  };

  const onUpdateItem = async () => {
    if (!selectedItem || !familyId) return;
    if (!editForm.name.trim()) {
      Alert.alert("ไม่พบชื่อสินค้า", "กรุณากรอกชื่อสินค้า");
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("items")
        .update({
          name: editForm.name.trim(),
          category: editForm.category.trim() || null,
        })
        .eq("id", selectedItem.id)
        .eq("family_id", familyId);
      if (error) throw error;

      setIsEditDialogOpen(false);
      setSelectedItem(null);
      await fetchInventory();
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถอัปเดตสินค้าได้";
      Alert.alert("ไม่สามารถอัปเดตสินค้าได้", message);
    } finally {
      setSubmitting(false);
    }
  };

  const onDeleteItem = (item: InventoryItem) => {
    Alert.alert("ลบสินค้า", `ลบ "${item.name}" จากคลังสินค้า?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (!familyId) return;
            const { error } = await supabase
              .from("items")
              .delete()
              .eq("id", item.id)
              .eq("family_id", familyId);
            if (error) throw error;
            await fetchInventory();
          } catch (error) {
            const message = error instanceof Error ? error.message : "ไม่สามารถลบสินค้าได้";
            Alert.alert("ไม่สามารถลบสินค้าได้", message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <ActivityIndicator size="large" color="#111827" />
        <Text className="mt-3 text-sm text-gray-600 dark:text-zinc-300 font-noto">กำลังโหลดคลังสินค้า...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
      <ScrollView className="flex-1 px-4 pt-5">
        <View className="mb-5 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-2xl text-black dark:text-white font-noto-bold">คลังสินค้า</Text>
            <Text className="mt-1 text-sm text-gray-600 dark:text-zinc-300 font-noto">
              สินค้าที่ต้องซื้อของครอบครัว
            </Text>
            <Text className="mt-1 text-xs text-gray-500 dark:text-zinc-400 font-noto">{itemCountLabel}</Text>
          </View>
          <Button
            variant="primary"
            className="rounded-full px-4 py-2"
            onPress={() => setIsCreateDialogOpen(true)}
            isDisabled={!familyId || submitting}
          >
            <View className="flex-row items-center">
              <Plus color="#fff" size={16} />
              <Text className="ml-2 text-sm text-white font-noto-bold">เพิ่ม</Text>
            </View>
          </Button>
        </View>

        {errorMessage ? (
          <View className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
            <Text className="text-sm text-red-700 dark:text-red-300 font-noto">{errorMessage}</Text>
            <Button
              variant="secondary"
              className="mt-3 rounded-full border border-red-300 dark:border-red-700"
              onPress={() => {
                setRefreshing(true);
                fetchInventory();
              }}
            >
              <Text className="text-sm text-red-700 dark:text-red-300 font-noto-bold">ลองใหม่</Text>
            </Button>
          </View>
        ) : null}

        <ListGroup className="rounded-2xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 overflow-hidden">
          {items.length === 0 ? (
            <View className="items-center p-6">
              <Package color="#9ca3af" size={24} />
              <Text className="mt-2 text-sm text-gray-500 dark:text-zinc-400 font-noto">ยังไม่มีรายการสินค้าในคลังสินค้า</Text>
            </View>
          ) : (
            items.map((item) => (
              <ListGroup.Item key={item.id}>
                <ListGroup.ItemPrefix>
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-700">
                    <Tag color="#4b5563" size={16} />
                  </View>
                </ListGroup.ItemPrefix>
                <ListGroup.ItemContent>
                  <Pressable
                    onPress={() => router.push(`/dashboard/inventory/${item.id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`ดูประวัติราคา ${item.name}`}
                  >
                    <ListGroup.ItemTitle className="text-base text-black dark:text-white font-noto-bold">
                      {item.name}
                    </ListGroup.ItemTitle>
                    <ListGroup.ItemDescription className="text-xs text-gray-500 dark:text-zinc-400 font-noto">
                      {item.category || "ไม่ได้ระบุหมวดหมู่"} · แตะเพื่อดูประวัติราคา
                    </ListGroup.ItemDescription>
                  </Pressable>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                  <View className="flex-row items-center gap-4 pl-2">
                    <Button variant="secondary" className="h-9 w-9 min-w-0 rounded-full px-0" onPress={() => openEditDialog(item)}>
                      <Pencil color="#2563eb" size={18} />
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-9 w-9 min-w-0 rounded-full px-0"
                      onPress={() => onDeleteItem(item)}
                      isDisabled={!currentUserId}
                    >
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
            <Dialog.Title className="mt-3 text-xl text-black font-noto-bold">สร้างรายการสินค้า</Dialog.Title>
            <Dialog.Description className="mb-4 text-sm text-gray-600 font-noto">
              สร้างรายการสินค้าที่ต้องซื้อของครอบครัว
            </Dialog.Description>
            <Input
              className="mb-3 border border-gray-300 p-3"
              placeholder="ชื่อสินค้า (ตัวอย่าง: นม)"
              value={createForm.name}
              onChangeText={(value) => setCreateForm((prev) => ({ ...prev, name: value }))}
            />
            <Input
              className="border border-gray-300 p-3"
              placeholder="หมวดหมู่ (optional: อาหารที่ต้องซื้อ)"
              value={createForm.category}
              onChangeText={(value) => setCreateForm((prev) => ({ ...prev, category: value }))}
            />
            <Button variant="primary" className="mt-4 rounded-full" isDisabled={submitting} onPress={onCreateItem}>
              <Text className="text-base text-white font-noto-bold">{submitting ? "กำลังบันทึก..." : "บันทึกรายการสินค้า"}</Text>
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Close />
            <Dialog.Title className="mt-3 text-xl text-black font-noto-bold">แก้ไขรายการสินค้า</Dialog.Title>
            <Dialog.Description className="mb-4 text-sm text-gray-600 font-noto">
              บันทึกเทมเพลตสินค้าที่ต้องซื้อของคุณ
            </Dialog.Description>
            <Input
              className="mb-3 border border-gray-300 p-3"
              placeholder="ชื่อสินค้า"
              value={editForm.name}
              onChangeText={(value) => setEditForm((prev) => ({ ...prev, name: value }))}
            />
            <Input
              className="border border-gray-300 p-3"
              placeholder="หมวดหมู่ (optional)"
              value={editForm.category}
              onChangeText={(value) => setEditForm((prev) => ({ ...prev, category: value }))}
            />
            <Button variant="primary" className="mt-4 rounded-full" isDisabled={submitting} onPress={onUpdateItem}>
              <Text className="text-base text-white font-noto-bold">{submitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</Text>
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </View>
  );
}
