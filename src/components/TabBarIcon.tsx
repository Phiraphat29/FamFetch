import type { ComponentProps, ComponentType } from "react";
import { useEffect } from "react";
import { Home } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export type LucideTabIconComponent = ComponentType<ComponentProps<typeof Home>>;

export type TabBarIconProps = {
  Icon: LucideTabIconComponent;
  focused: boolean;
  color: string;
  size?: number;
};

const spring = { damping: 16, stiffness: 220, mass: 0.6 };

export function TabBarIcon({ Icon, focused, color, size = 22 }: TabBarIconProps) {
  const focus = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    focus.value = withSpring(focused ? 1 : 0, spring);
  }, [focused]);

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.92 + 0.1 * focus.value }],
  }));

  return (
    <Animated.View style={wrapperStyle}>
      <Icon
        size={size}
        color={color}
        strokeWidth={focused ? 2.5 : 2}
        absoluteStrokeWidth
      />
    </Animated.View>
  );
}
