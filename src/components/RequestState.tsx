import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { theme } from "./theme";

export function RequestState({
  kind,
  title,
  message,
  actionLabel,
  onAction,
  disabled = false,
}: {
  kind: "loading" | "error" | "empty" | "success";
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
}) {
  return (
    <View
      style={styles.container}
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: kind === "loading" }}
    >
      {kind === "loading" && (
        <ActivityIndicator
          accessibilityLabel={title}
          color={theme.colors.primary}
        />
      )}
      <Text
        accessibilityRole={kind === "error" ? "alert" : "header"}
        style={[styles.title, kind === "error" && styles.error]}
      >
        {title}
      </Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onAction}
          style={[styles.button, disabled && styles.disabled]}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, alignItems: "center" },
  title: {
    ...theme.typography.heading,
    color: theme.colors.text,
    textAlign: "center",
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  error: { color: theme.colors.errorText },
  button: {
    minHeight: 52,
    minWidth: 44,
    padding: 14,
    alignSelf: "stretch",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
  },
  buttonText: { ...theme.typography.label, color: theme.colors.surface },
  disabled: { opacity: 0.45 },
});
