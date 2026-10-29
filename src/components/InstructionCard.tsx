import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { validInstructionInput } from "../context/validation";
import type { SelectedStop } from "../types/domain";
import { theme } from "./theme";

export function InstructionCard({
  item,
  error,
  disabled = false,
  onChange,
  onClear,
  onRemove,
}: {
  item: SelectedStop;
  error?: string;
  disabled?: boolean;
  onChange: (text: string) => void;
  onClear: () => void;
  onRemove?: () => void;
}) {
  const [inputError, setInputError] = useState<string | null>(null);
  const message = error || inputError;
  return (
    <View style={[styles.card, !!message && styles.invalid]}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.stop.name || "Unknown stop"}</Text>
        <Text style={styles.quantity}>{item.packages}×</Text>
      </View>
      <Text style={styles.address}>{item.stop.address}</Text>
      <TextInput
        accessibilityLabel={`Instructions for ${item.stop.name || "Unknown stop"}`}
        accessibilityHint="Required. Maximum 200 characters."
        accessibilityState={{ disabled }}
        editable={!disabled}
        multiline
        maxLength={200}
        value={item.instructions}
        placeholder="Add delivery instructions…"
        placeholderTextColor={theme.colors.textSecondary}
        onChangeText={(text) => {
          if (!validInstructionInput(text)) {
            setInputError(
              "Keep instructions within 200 characters without splitting an emoji.",
            );
            return;
          }
          setInputError(null);
          onChange(text);
        }}
        style={[styles.input, !!message && styles.invalidInput]}
        textAlignVertical="top"
      />
      {!!message && (
        <Text accessibilityRole="alert" style={styles.error}>
          {message}
        </Text>
      )}
      <View style={styles.row}>
        <Text style={styles.counter}>{item.instructions.length}/200</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Clear all instructions for ${item.stop.name || "Unknown stop"}`}
          accessibilityState={{ disabled }}
          disabled={disabled}
          style={[styles.action, disabled && styles.disabled]}
          onPress={() => {
            setInputError(null);
            onClear();
          }}
        >
          <Text style={styles.actionText}>Clear all</Text>
        </Pressable>
      </View>
      {onRemove && (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          disabled={disabled}
          style={[styles.action, disabled && styles.disabled]}
          accessibilityLabel={`Remove ${item.stop.name || "Unknown stop"} from route`}
          onPress={onRemove}
        >
          <Text style={styles.actionText}>Remove from route</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  name: { ...theme.typography.label, color: theme.colors.text, flex: 1 },
  quantity: { ...theme.typography.label, color: theme.colors.primary },
  address: { ...theme.typography.body, color: theme.colors.textSecondary },
  input: {
    ...theme.typography.body,
    color: theme.colors.text,
    backgroundColor: theme.colors.card,
    minHeight: 120,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    writingDirection: "ltr",
    textAlign: "left",
  },
  disabled: { opacity: 0.45 },
  counter: { ...theme.typography.counter, color: theme.colors.textSecondary },
  action: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  actionText: { ...theme.typography.label, color: theme.colors.primary },
  invalid: { borderColor: theme.colors.errorBorder },
  invalidInput: {
    borderColor: theme.colors.errorBorder,
    backgroundColor: theme.colors.errorBackground,
  },
  error: { ...theme.typography.caption, color: theme.colors.errorText },
});
