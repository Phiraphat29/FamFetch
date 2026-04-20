import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, BackHandler, Text, useColorScheme, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import { ChevronLeft } from "lucide-react-native";
import { supabase } from "../../../lib/supabase";
import WarningDialog from "../../../components/dialog/WarningDialog";
import { AddTemplatesToTripDialog, CheckoutShoppingItemDialog } from "../../../components/shopping/ShoppingTripDialogs";
import { ShoppingTripListViews } from "../../../components/shopping/ShoppingTripListViews";
import {
  SHOPPING_TEMPLATE_PAGE_SIZE,
  type ItemTemplate,
  type ShoppingListItemRow,
  type ShoppingListMeta,
} from "../../../components/shopping/shoppingTripTypes";

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
  const [listItems, setListItems] = useState<ShoppingListItemRow[]>([]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(() => new Set());
  const [templatePage, setTemplatePage] = useState(1);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [selectedListItem, setSelectedListItem] = useState<ShoppingListItemRow | null>(null);
  const [checkoutPrice, setCheckoutPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ShoppingListItemRow | null>(null);

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
  const totalTemplatePages = Math.max(1, Math.ceil(templates.length / SHOPPING_TEMPLATE_PAGE_SIZE));
  const paginatedTemplates = useMemo(() => {
    const start = (templatePage - 1) * SHOPPING_TEMPLATE_PAGE_SIZE;
    return templates.slice(start, start + SHOPPING_TEMPLATE_PAGE_SIZE);
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
      setListItems((listItemData ?? []) as unknown as ShoppingListItemRow[]);
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
        setTemplates((prev) => {
          const next = [...prev, data as ItemTemplate].sort((a, b) => a.name.localeCompare(b.name));
          const lastPage = Math.max(1, Math.ceil(next.length / SHOPPING_TEMPLATE_PAGE_SIZE));
          queueMicrotask(() => setTemplatePage(lastPage));
          return next;
        });
        setSelectedTemplateIds((prev) => {
          const next = new Set(prev);
          next.add(data.id);
          return next;
        });
      }
      setNewTemplateName("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถสร้างเทมเพลตสินค้าได้";
      openWarning(message);
    } finally {
      setCreatingTemplate(false);
    }
  };

  const openCheckoutDialog = (item: ShoppingListItemRow) => {
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

  const markAsPending = async (item: ShoppingListItemRow) => {
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

  const removeListItem = (item: ShoppingListItemRow) => {
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

      <ShoppingTripListViews
        tripCompleted={trip?.is_completed ?? undefined}
        errorMessage={errorMessage}
        onRetry={loadData}
        familyId={familyId}
        templatesCount={templates.length}
        onOpenAddDialog={() => setAddDialogOpen(true)}
        pendingItems={pendingItems}
        boughtItems={boughtItems}
        currentUserId={currentUserId}
        onCheckout={openCheckoutDialog}
        onRemoveItem={removeListItem}
        onMarkPending={markAsPending}
        totalPrice={totalPrice}
      />

      <AddTemplatesToTripDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setAddDialogOpen}
        templates={templates}
        paginatedTemplates={paginatedTemplates}
        templatePage={templatePage}
        totalTemplatePages={totalTemplatePages}
        onTemplatePageChange={setTemplatePage}
        selectedTemplateIds={selectedTemplateIds}
        onToggleTemplate={toggleTemplateSelection}
        isTemplateAlreadyPending={isTemplateAlreadyPending}
        newTemplateName={newTemplateName}
        onNewTemplateNameChange={setNewTemplateName}
        creatingTemplate={creatingTemplate}
        onCreateTemplate={createTemplateFromDialog}
        submitting={submitting}
        onAddToTrip={addItemsToTrip}
      />

      <CheckoutShoppingItemDialog
        isOpen={isCheckoutDialogOpen}
        onOpenChange={setIsCheckoutDialogOpen}
        checkoutPrice={checkoutPrice}
        onCheckoutPriceChange={setCheckoutPrice}
        submitting={submitting}
        onConfirmCheckout={checkoutItem}
      />

      <WarningDialog isOpen={isWarningOpen} onOpenChange={setIsWarningOpen} description={warningMessage} />
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
