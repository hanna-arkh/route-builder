import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Stop } from "../types/domain";
import { theme } from "./theme";

interface Props {
  stop: Stop;
  packages?: number;
  disabled?: boolean;
  onSelect: () => void;
  onQuantity: () => void;
}

export const StopRow = memo(function StopRow({
  stop,
  packages,
  disabled = false,
  onSelect,
  onQuantity,
}: Props) {
  const name = stop.name.trim() || "Unknown stop";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("")
    .toUpperCase();
  return (
    <View style={[styles.row, packages !== undefined && styles.selected]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`${name}, ${stop.address}, ${stop.phone || "No phone"}`}
        accessibilityState={{ checked: packages !== undefined, disabled }}
        disabled={disabled}
        onPress={onSelect}
        style={styles.select}
      >
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.secondary}>{stop.address}</Text>
          <Text style={styles.secondary}>
            {stop.phone.trim() || "No phone"}
          </Text>
        </View>
      </Pressable>
      {packages !== undefined && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Packages for ${name}: ${packages}`}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onQuantity}
          style={styles.quantity}
        >
          <Text style={styles.initials}>{packages}×</Text>
        </Pressable>
      )}
    </View>
  );
});
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
  },
  selected: { backgroundColor: theme.colors.selected },
  select: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    minHeight: 44,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  details: { flex: 1, gap: 2 },
  name: { ...theme.typography.label, color: theme.colors.text },
  secondary: { ...theme.typography.caption, color: theme.colors.textSecondary },
  initials: { ...theme.typography.label, color: theme.colors.primary },
  quantity: {
    minHeight: 44,
    minWidth: 44,
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
});
