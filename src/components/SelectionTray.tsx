import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SelectedStop } from "../types/domain";
import { theme } from "./theme";

export function SelectionTray({
  selected,
  disabled = false,
  onContinue,
}: {
  selected: readonly SelectedStop[];
  disabled?: boolean;
  onContinue: () => void;
}) {
  const count = new Set(selected.map((item) => item.stop.id)).size;
  const unavailable = disabled || count === 0;
  return (
    <SafeAreaView edges={{ bottom: "maximum" }} style={styles.tray}>
      {count > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {selected.map((item) => (
            <View key={item.stop.id} style={styles.chip}>
              <Text style={styles.address}>{item.stop.address}</Text>
            </View>
          ))}
        </ScrollView>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: unavailable }}
        disabled={unavailable}
        onPress={onContinue}
        style={[styles.button, unavailable && styles.disabled]}
      >
        <Text style={styles.label}>Continue ({count} stops)</Text>
      </Pressable>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  tray: {
    padding: 16,
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  chips: { gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.selected,
  },
  address: { ...theme.typography.caption, color: theme.colors.primary },
  button: {
    minHeight: 52,
    padding: 14,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { backgroundColor: theme.colors.disabled },
  label: { ...theme.typography.label, color: theme.colors.surface },
});
