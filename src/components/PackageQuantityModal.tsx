import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { validPackages } from "../context/validation";
import type { SelectedStop } from "../types/domain";
import { theme } from "./theme";

export function PackageQuantityModal({
  item,
  disabled = false,
  onSave,
  onClose,
}: {
  item: SelectedStop;
  disabled?: boolean;
  onSave: (quantity: number) => void;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState(item.packages);
  const canDecrease = !disabled && validPackages(item.stop, quantity - 1);
  const canIncrease = !disabled && validPackages(item.stop, quantity + 1);
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel package changes"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View accessibilityViewIsModal style={styles.sheet}>
          <Text accessibilityRole="header" style={styles.heading}>
            Number of packages
          </Text>
          <Text style={styles.text}>{item.stop.name || "Unknown stop"}</Text>
          <View style={styles.stepper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease packages"
              accessibilityState={{ disabled: !canDecrease }}
              disabled={!canDecrease}
              onPress={() => setQuantity((value) => value - 1)}
              style={[styles.control, !canDecrease && styles.dim]}
            >
              <Text style={styles.heading}>−</Text>
            </Pressable>
            <Text accessibilityLiveRegion="polite" style={styles.heading}>
              {quantity}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase packages"
              accessibilityState={{ disabled: !canIncrease }}
              disabled={!canIncrease}
              onPress={() => setQuantity((value) => value + 1)}
              style={[styles.control, !canIncrease && styles.dim]}
            >
              <Text style={styles.heading}>+</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            style={[styles.save, disabled && styles.dim]}
            onPress={() => {
              if (validPackages(item.stop, quantity)) onSave(quantity);
            }}
          >
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={styles.control}
          >
            <Text style={styles.text}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    gap: 16,
  },
  heading: { ...theme.typography.heading, color: theme.colors.text },
  text: { ...theme.typography.body, color: theme.colors.text },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  control: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  save: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  saveText: { ...theme.typography.label, color: theme.colors.surface },
  dim: { opacity: 0.45 },
});
