import { Pressable, Text, View } from "react-native";
import { Button, Checkbox, Dialog, Input } from "heroui-native";
import type { ItemTemplate } from "./shoppingTripTypes";

type AddTemplatesDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  templates: ItemTemplate[];
  paginatedTemplates: ItemTemplate[];
  templatePage: number;
  totalTemplatePages: number;
  onTemplatePageChange: (page: number) => void;
  selectedTemplateIds: Set<string>;
  onToggleTemplate: (templateId: string, selected: boolean) => void;
  isTemplateAlreadyPending: (templateId: string) => boolean;
  newTemplateName: string;
  onNewTemplateNameChange: (value: string) => void;
  creatingTemplate: boolean;
  onCreateTemplate: () => void;
  submitting: boolean;
  onAddToTrip: () => void;
};

export function AddTemplatesToTripDialog({
  isOpen,
  onOpenChange,
  templates,
  paginatedTemplates,
  templatePage,
  totalTemplatePages,
  onTemplatePageChange,
  selectedTemplateIds,
  onToggleTemplate,
  isTemplateAlreadyPending,
  newTemplateName,
  onNewTemplateNameChange,
  creatingTemplate,
  onCreateTemplate,
  submitting,
  onAddToTrip,
}: AddTemplatesDialogProps) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
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
                          onToggleTemplate(template.id, selected);
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
                        onToggleTemplate(template.id, !selectedTemplateIds.has(template.id));
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
                onPress={() => onTemplatePageChange(Math.max(1, templatePage - 1))}
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
                onPress={() => onTemplatePageChange(Math.min(totalTemplatePages, templatePage + 1))}
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
              onChangeText={onNewTemplateNameChange}
            />
            <Button
              variant="secondary"
              className="mt-2 rounded-full"
              isDisabled={creatingTemplate || !newTemplateName.trim()}
              onPress={onCreateTemplate}
            >
              <Text className="text-sm text-black dark:text-white font-noto-bold">
                {creatingTemplate ? "กำลังสร้างเทมเพลต..." : "สร้างเทมเพลตและเลือกอัตโนมัติ"}
              </Text>
            </Button>
          </View>
          <Button variant="primary" className="mt-4 rounded-full" isDisabled={submitting} onPress={onAddToTrip}>
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
  );
}

type CheckoutDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  checkoutPrice: string;
  onCheckoutPriceChange: (value: string) => void;
  submitting: boolean;
  onConfirmCheckout: () => void;
};

export function CheckoutShoppingItemDialog({
  isOpen,
  onOpenChange,
  checkoutPrice,
  onCheckoutPriceChange,
  submitting,
  onConfirmCheckout,
}: CheckoutDialogProps) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Close />
          <Dialog.Title className="mt-3 text-xl text-black font-noto-bold">ตรวจสอบสินค้า</Dialog.Title>
          <Dialog.Description className="mb-4 text-sm text-gray-600 dark:text-zinc-300 font-noto">
            ตั้งราคาสินค้าและทำเครื่องหมายสินค้านี้ว่าซื้อแล้ว
          </Dialog.Description>
          <Input
            className="border border-gray-300 p-3"
            keyboardType="numeric"
            placeholder="ราคาสินค้า"
            value={checkoutPrice}
            onChangeText={onCheckoutPriceChange}
          />
          <Button variant="primary" className="mt-4 rounded-full" isDisabled={submitting} onPress={onConfirmCheckout}>
            <Text className="text-base text-white font-noto-bold">{submitting ? "กำลังบันทึก..." : "ทำเครื่องหมายว่าซื้อแล้ว"}</Text>
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
