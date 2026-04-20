import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, BackHandler, Pressable, ScrollView, Text, useColorScheme, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Checkbox, Dialog, Input, ListGroup } from "heroui-native";
import { Check, ChevronLeft, CircleDashed, DollarSign, Plus, Trash2, Undo2 } from "lucide-react-native";
import { supabase } from "../../../lib/supabase";
import WarningDialog from "../../../components/dialog/WarningDialog";

type ItemTemplate = {
  id: string;
  family_id: string;
  name: string;
  category: string | null;
};

type ListItemRow = {
  id: string;
  list_id: string;
  item_id: string;
  is_bought: boolean | null;
  purchased_price: number | null;
  purchased_by: string | null;
  created_at: string;
  item: {
    id: string;
    name: string;
    category: string | null;
  } | null;
};

type ShoppingListMeta = {
  id: string;
  family_id: string;
  title: string;
  is_completed: boolean | null;
  created_at: string;
};

function parseTripId(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

export default function ShoppingListDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const tripId = parseTripId(id);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [trip, setTrip] = useState<ShoppingListMeta | null>(null);
  const [templates, setTemplates] = useState<ItemTemplate[]>([]);
  const [listItems, setListItems] = useState<ListItemRow[]>([]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(() => new Set());
  const [templatePage, setTemplatePage] = useState(1);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [selectedListItem, setSelectedListItem] = useState<ListItemRow | null>(null);
  const [checkoutPrice, setCheckoutPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ListItemRow | null>(null);

  const openWarning = useCallback((message: string) => {
    setWarningMessage(message);
    setIsWarningOpen(true);
  }, []);

  const pendingItems = useMemo(() => listItems.filter((item) => !item.is_bought), [listItems]);
  const boughtItems = useMemo(() => listItems.filter((item) => !!item.is_bought), [listItems]);
  const totalPrice = useMemo(
    () => boughtItems.reduce((sum, item) => sum + (Number(item.purchased_price) || 0), 0),
    [boughtItems]
  );
  const TEMPLATE_PAGE_SIZE = 4;
  const totalTemplatePages = Math.max(1, Math.ceil(templates.length / TEMPLATE_PAGE_SIZE));
  const paginatedTemplates = useMemo(() => {
    const start = (templatePage - 1) * TEMPLATE_PAGE_SIZE;
    return templates.slice(start, start + TEMPLATE_PAGE_SIZE);
  }, [templatePage, templates]);

  const loadData = useCallback(async () => {
    if (!tripId) {
      setErrorMessage("ไม่พบรายการซื้อของ");
      setLoading(false);
      return;
    }

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

      setCurrentUserId(session.user.id);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("family_id")
        .eq("id", session.user.id)
        .single();
      if (profileError) throw profileError;
      if (!profileData?.family_id) {
        setErrorMessage("No family found for this account.");
        setLoading(false);
        return;
      }

      setFamilyId(profileData.family_id);

      const { data: tripData, error: tripError } = await supabase
        .from("shopping_lists")
        .select("id,family_id,title,is_completed,created_at")
        .eq("id", tripId)
        .eq("family_id", profileData.family_id)
        .single();
      if (tripError) throw tripError;
      setTrip(tripData as ShoppingListMeta);

      const { data: templateData, error: templateError } = await supabase
        .from("items")
        .select("id,family_id,name,category")
        .eq("family_id", profileData.family_id)
        .order("name", { ascending: true });
      if (templateError) throw templateError;
      setTemplates((templateData ?? []) as ItemTemplate[]);

      const { data: listItemData, error: listItemError } = await supabase
        .from("list_items")
        .select("id,list_id,item_id,is_bought,purchased_price,purchased_by,created_at,item:items(id,name,category)")
        .eq("list_id", tripId)
        .order("created_at", { ascending: true });
      if (listItemError) throw listItemError;
      setListItems((listItemData ?? []) as unknown as ListItemRow[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถโหลดรายการซื้อของได้";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace("/dashboard/shopping");
        return true;
      };

      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => sub.remove();
    }, [])
  );

  const setAddDialogOpen = useCallback((open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      setSelectedTemplateIds(new Set());
      setNewTemplateName("");
      setTemplatePage(1);
    }
  }, []);

  const toggleTemplateSelection = useCallback((templateId: string, selected: boolean) => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(templateId);
      else next.delete(templateId);
      return next;
    });
  }, []);

  const isTemplateAlreadyPending = useCallback(
    (templateId: string) => listItems.some((item) => item.item_id === templateId && !item.is_bought),
    [listItems]
  );

  const addItemsToTrip = async () => {
    if (!tripId) {
      openWarning("ไม่พบรายการทริป");
      return;
    }

    const toAdd = [...selectedTemplateIds].filter((id) => !isTemplateAlreadyPending(id));
    if (toAdd.length === 0) {
      openWarning("เลือกอย่างน้อยหนึ่งเทมเพลตที่ยังไม่อยู่ในส่วนรอซื้อ หรือรายการที่เลือกอยู่ในบิลแล้วทั้งหมด");
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("list_items")
        .insert(toAdd.map((item_id) => ({ list_id: tripId, item_id })));
      if (error) throw error;

      setSelectedTemplateIds(new Set());
      setIsAddDialogOpen(false);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "เพิ่มรายการไม่สำเร็จ";
      openWarning(message);
    } finally {
      setSubmitting(false);
    }
  };

  const createTemplateFromDialog = async () => {
    if (!familyId) {
      openWarning("ไม่พบครอบครัวของคุณ");
      return;
    }
    const name = newTemplateName.trim();
    if (!name) {
      openWarning("กรุณากรอกชื่อสินค้า");
      return;
    }

    try {
      setCreatingTemplate(true);
      const { data, error } = await supabase
        .from("items")
        .insert({
          family_id: familyId,
          name,
          category: null,
        })
        .select("id,family_id,name,category")
        .single();
      if (error) throw error;

      if (data) {
        setTemplates((prev) => [...prev, data as ItemTemplate].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedTemplateIds((prev) => {
          const next = new Set(prev);
          next.add(data.id);
          return next;
        });
        setTemplatePage(totalTemplatePages);
      }
      setNewTemplateName("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถสร้างเทมเพลตสินค้าได้";
      openWarning(message);
    } finally {
      setCreatingTemplate(false);
    }
  };

  const openCheckoutDialog = (item: ListItemRow) => {
    setSelectedListItem(item);
    setCheckoutPrice(item.purchased_price ? String(item.purchased_price) : "");
    setIsCheckoutDialogOpen(true);
  };

  const checkoutItem = async () => {
    if (!selectedListItem || !currentUserId) return;

    const parsedPrice = Number(checkoutPrice);
    if (!checkoutPrice || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      openWarning("กรุณากรอกราคาสินค้าให้ถูกต้อง");
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("list_items")
        .update({
          is_bought: true,
          purchased_price: parsedPrice,
          purchased_by: currentUserId,
        })
        .eq("id", selectedListItem.id)
        .eq("list_id", tripId);
      if (error) throw error;

      setIsCheckoutDialogOpen(false);
      setSelectedListItem(null);
      setCheckoutPrice("");
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถทำเครื่องหมายว่าซื้อแล้วได้";
      openWarning(message);
    } finally {
      setSubmitting(false);
    }
  };

  const markAsPending = async (item: ListItemRow) => {
    try {
      const { error } = await supabase
        .from("list_items")
        .update({
          is_bought: false,
          purchased_price: null,
          purchased_by: null,
        })
        .eq("id", item.id)
        .eq("list_id", tripId);
      if (error) throw error;
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถย้อนกลับสินค้าได้";
      openWarning(message);
    }
  };

  const removeListItem = (item: ListItemRow) => {
    setDeleteTarget(item);
  };

  const confirmRemoveListItem = async () => {
    if (!deleteTarget) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("list_items")
        .delete()
        .eq("id", deleteTarget.id)
        .eq("list_id", tripId);
      if (error) throw error;
      setDeleteTarget(null);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถลบสินค้าได้";
      setDeleteTarget(null);
      openWarning(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <ActivityIndicator size="large" color="#111827" />
        <Text className="mt-3 text-sm text-gray-600 dark:text-zinc-300 font-noto">กำลังโหลดรายละเอียดรายการซื้อของ...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-zinc-900">
      <View
        className="border-b border-gray-200 bg-white px-3 pb-3 dark:border-zinc-800 dark:bg-zinc-950"
        style={{ paddingTop: Math.max(insets.top, 12) }}
      >
        <View className="flex-row items-center gap-1">
          <Button
            variant="secondary"
            className="h-10 w-10 min-w-0 rounded-full px-0"
            onPress={() => router.replace("/dashboard/shopping")}
          >
            <ChevronLeft color={colorScheme === "dark" ? "#fafafa" : "#171717"} size={24} />
          </Button>
          <View className="min-w-0 flex-1 pl-1">
            <Text className="text-lg text-black dark:text-white font-noto-bold" numberOfLines={2}>
              {trip?.title ?? "รายละเอียดรายการซื้อของ"}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-zinc-400 font-noto">
              {trip?.created_at ? new Date(trip.created_at).toLocaleDateString() : "-"}
            </Text>
          </View>
        </View>
      </View>
      <ScrollView className="flex-1 px-4 pt-4 pb-28">
        <View className="mb-4">
          <Text className="text-sm text-gray-600 dark:text-zinc-300 font-noto">
            {trip?.is_completed ? "สำเร็จ" : "กำลังดำเนินการ"}
          </Text>
        </View>

        {errorMessage ? (
          <View className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
            <Text className="text-sm text-red-700 dark:text-red-300 font-noto">{errorMessage}</Text>
            <Button variant="secondary" className="mt-3 rounded-full border border-red-300" onPress={loadData}>
              <Text className="text-sm text-red-700 font-noto-bold">ลองใหม่</Text>
            </Button>
          </View>
        ) : null}

        <Button
          variant="primary"
          className="mb-4 rounded-full"
          onPress={() => setAddDialogOpen(true)}
          isDisabled={!familyId || templates.length === 0}
        >
          <View className="flex-row items-center justify-center">
            <Plus size={16} color="#fff" />
            <Text className="ml-2 text-sm text-white font-noto-bold">เพิ่มสินค้าเข้าไปในรายการซื้อของ</Text>
          </View>
        </Button>

        <View className="mb-4">
          <Text className="mb-2 text-base text-black dark:text-white font-noto-bold">รอซื้อ ({pendingItems.length})</Text>
          <ListGroup className="rounded-2xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 overflow-hidden">
            {pendingItems.length === 0 ? (
              <View className="items-center p-5">
                <CircleDashed color="#9ca3af" size={22} />
                <Text className="mt-2 text-sm text-gray-500 dark:text-zinc-400 font-noto">ยังไม่มีสินค้ารอซื้อ.</Text>
              </View>
            ) : (
              pendingItems.map((item) => (
                <ListGroup.Item key={item.id} onPress={() => openCheckoutDialog(item)}>
                  <ListGroup.ItemPrefix>
                    <CircleDashed color="#6b7280" size={18} />
                  </ListGroup.ItemPrefix>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle className="text-base text-black dark:text-white font-noto-bold">
                      {item.item?.name ?? "Unknown item"}
                    </ListGroup.ItemTitle>
                    <ListGroup.ItemDescription className="text-xs text-gray-500 dark:text-zinc-400 font-noto">
                      {item.item?.category || "ไม่ได้ระบุหมวดหมู่"} - แตะเพื่อตรวจสอบสินค้า
                    </ListGroup.ItemDescription>
                  </ListGroup.ItemContent>
                  <ListGroup.ItemSuffix>
                    <Button variant="secondary" className="h-9 w-9 min-w-0 rounded-full px-0" onPress={() => removeListItem(item)}>
                      <Trash2 color="#dc2626" size={18} />
                    </Button>
                  </ListGroup.ItemSuffix>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        </View>

        <View>
          <Text className="mb-2 text-base text-black dark:text-white font-noto-bold">ซื้อแล้ว ({boughtItems.length})</Text>
          <ListGroup className="rounded-2xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 overflow-hidden">
            {boughtItems.length === 0 ? (
              <View className="items-center p-5">
                <Check color="#9ca3af" size={22} />
                <Text className="mt-2 text-sm text-gray-500 dark:text-zinc-400 font-noto">ยังไม่มีสินค้าที่ซื้อแล้ว.</Text>
              </View>
            ) : (
              boughtItems.map((item) => (
                <ListGroup.Item key={item.id}>
                  <ListGroup.ItemPrefix>
                    <Check color="#16a34a" size={18} />
                  </ListGroup.ItemPrefix>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle className="text-base text-black dark:text-white font-noto-bold">
                      {item.item?.name ?? "Unknown item"}
                    </ListGroup.ItemTitle>
                    <ListGroup.ItemDescription className="text-xs text-gray-500 dark:text-zinc-400 font-noto">
                      {item.purchased_price ? `ราคาสินค้า: ${item.purchased_price}` : "ไม่ระบุราคา"} - จ่ายโดย
                      {item.purchased_by ? (item.purchased_by === currentUserId ? "คุณ" : "สมาชิกครอบครัว") : "-"}
                    </ListGroup.ItemDescription>
                  </ListGroup.ItemContent>
                  <ListGroup.ItemSuffix>
                    <View className="flex-row items-center gap-1">
                      <Button
                        variant="secondary"
                        className="h-9 w-9 min-w-0 rounded-full px-0"
                        onPress={() => markAsPending(item)}
                      >
                        <Undo2 color="#2563eb" size={18} />
                      </Button>
                      <Button variant="secondary" className="h-9 w-9 min-w-0 rounded-full px-0" onPress={() => removeListItem(item)}>
                        <Trash2 color="#dc2626" size={18} />
                      </Button>
                    </View>
                  </ListGroup.ItemSuffix>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        </View>
      </ScrollView>

      <View className="absolute bottom-4 left-4 right-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <DollarSign color="#16a34a" size={18} />
            <Text className="ml-2 text-sm text-gray-600 dark:text-zinc-300 font-noto">ราคารวม</Text>
          </View>
          <Text className="text-xl text-green-600 dark:text-green-400 font-noto-bold">{totalPrice.toFixed(2)}</Text>
        </View>
      </View>

      <Dialog isOpen={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Close />
            <Dialog.Title className="mt-3 text-xl text-black dark:text-white font-noto-bold">เพิ่มสินค้าจากเทมเพลตสินค้า</Dialog.Title>
            <Dialog.Description className="mb-3 text-sm text-gray-600 dark:text-zinc-300 font-noto">
              เลือกได้หลายรายการ (ช่องทำเครื่องหมาย) แล้วกดเพิ่มเข้าไปในรายการซื้อของนี้
            </Dialog.Description>
            <View className="rounded-2xl border border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 overflow-hidden">
              {templates.length === 0 ? (
                <View className="items-center p-5">
                  <Text className="text-sm text-gray-500 dark:text-zinc-400 font-noto">ยังไม่มีเทมเพลตสินค้า</Text>
                </View>
              ) : (
                paginatedTemplates.map((template, index) => {
                  const alreadyPending = isTemplateAlreadyPending(template.id);
                  const isChecked = alreadyPending || selectedTemplateIds.has(template.id);
                  return (
                    <View
                      key={template.id}
                      className="flex-row items-center px-3 py-3"
                      style={{ borderBottomWidth: index === paginatedTemplates.length - 1 ? 0 : 1, borderBottomColor: "#e5e7eb" }}
                    >
                      <View className="py-1 pr-2">
                        <Checkbox
                          isSelected={isChecked}
                          onSelectedChange={(selected) => {
                            if (alreadyPending) return;
                            toggleTemplateSelection(template.id, selected);
                          }}
                          isDisabled={alreadyPending}
                        />
                      </View>
                      <Pressable
                        className="flex-1"
                        accessibilityRole="button"
                        disabled={alreadyPending}
                        onPress={() => {
                          if (alreadyPending) return;
                          toggleTemplateSelection(template.id, !selectedTemplateIds.has(template.id));
                        }}
                      >
                        <Text className="text-base text-black dark:text-white font-noto-bold">{template.name}</Text>
                        <Text className="text-xs text-gray-500 dark:text-zinc-400 font-noto">
                          {alreadyPending ? "อยู่ในส่วนรอซื้อแล้ว" : template.category || "ไม่ได้ระบุหมวดหมู่"}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })
              )}
            </View>
            {templates.length > 0 ? (
              <View className="mt-2 flex-row items-center justify-between">
                <Button
                  variant="secondary"
                  className="rounded-full px-3"
                  isDisabled={templatePage <= 1}
                  onPress={() => setTemplatePage((prev) => Math.max(1, prev - 1))}
                >
                  <Text className="text-xs text-black dark:text-white font-noto-bold">ก่อนหน้า</Text>
                </Button>
                <Text className="text-xs text-gray-500 dark:text-zinc-400 font-noto">
                  หน้า {templatePage} / {totalTemplatePages}
                </Text>
                <Button
                  variant="secondary"
                  className="rounded-full px-3"
                  isDisabled={templatePage >= totalTemplatePages}
                  onPress={() => setTemplatePage((prev) => Math.min(totalTemplatePages, prev + 1))}
                >
                  <Text className="text-xs text-black dark:text-white font-noto-bold">ถัดไป</Text>
                </Button>
              </View>
            ) : null}
            <View className="mt-3 rounded-xl border border-gray-200 p-3 dark:border-zinc-700">
              <Text className="mb-2 text-sm text-gray-700 dark:text-zinc-200 font-noto-bold">เพิ่มเทมเพลตใหม่อย่างรวดเร็ว</Text>
              <Input
                className="border border-gray-300 p-3"
                placeholder="ชื่อสินค้าใหม่ (เช่น ไข่ไก่)"
                value={newTemplateName}
                onChangeText={setNewTemplateName}
              />
              <Button
                variant="secondary"
                className="mt-2 rounded-full"
                isDisabled={creatingTemplate || !newTemplateName.trim()}
                onPress={createTemplateFromDialog}
              >
                <Text className="text-sm text-black dark:text-white font-noto-bold">
                  {creatingTemplate ? "กำลังสร้างเทมเพลต..." : "สร้างเทมเพลตและเลือกอัตโนมัติ"}
                </Text>
              </Button>
            </View>
            <Button variant="primary" className="mt-4 rounded-full" isDisabled={submitting} onPress={addItemsToTrip}>
              <Text className="text-base text-white font-noto-bold">
                {submitting
                  ? "กำลังเพิ่ม..."
                  : selectedTemplateIds.size > 0
                    ? `เพิ่ม ${selectedTemplateIds.size} รายการ`
                    : "เพิ่มเข้าไปในรายการซื้อของ"}
              </Text>
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog isOpen={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Close />
            <Dialog.Title className="mt-3 text-xl text-black font-noto-bold">ตรวจสอบสินค้า</Dialog.Title>
            <Dialog.Description className="mb-4 text-sm text-gray-600 font-noto">
              ตั้งราคาสินค้าและทำเครื่องหมายสินค้านี้ว่าซื้อแล้ว
            </Dialog.Description>
            <Input
              className="border border-gray-300 p-3"
              keyboardType="numeric"
              placeholder="ราคาสินค้า"
              value={checkoutPrice}
              onChangeText={setCheckoutPrice}
            />
            <Button variant="primary" className="mt-4 rounded-full" isDisabled={submitting} onPress={checkoutItem}>
              <Text className="text-base text-white font-noto-bold">{submitting ? "กำลังบันทึก..." : "ทำเครื่องหมายว่าซื้อแล้ว"}</Text>
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
      <WarningDialog
        isOpen={isWarningOpen}
        onOpenChange={setIsWarningOpen}
        description={warningMessage}
      />
      <WarningDialog
        isOpen={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="ลบสินค้า"
        description={`ลบ "${deleteTarget?.item?.name ?? "สินค้า"}" จากรายการซื้อของนี้?`}
        cancelText="Cancel"
        confirmText="ลบ"
        onConfirm={confirmRemoveListItem}
        isConfirming={submitting}
        tone="danger"
      />
    </View>
  );
}
