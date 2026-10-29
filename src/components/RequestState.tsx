import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
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
  retryAt = null,
  emptyKind = "directory",
}: {
  kind: "loading" | "error" | "empty" | "success";
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
  retryAt?: number | null;
  emptyKind?: "directory" | "search";
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (retryAt === null) return;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (retryAt > currentTime) timer = setTimeout(refresh, Math.min(retryAt - currentTime + 1, 2147483647));
    };
    timer = setTimeout(refresh, Math.max(0, Math.min(retryAt - Date.now() + 1, 2147483647)));
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") { clearTimeout(timer); refresh(); }
    });
    return () => { clearTimeout(timer); subscription.remove(); };
  }, [retryAt]);
  const waiting = retryAt !== null && retryAt > now;
  const unavailable = disabled || waiting;
  const heading = waiting ? "Waiting to retry" : title ?? (
    kind === "empty" ? (emptyKind === "search" ? "No stop found" : "No stops available")
      : kind === "loading" ? "Loading stops…" : kind === "error" ? "Unable to load stops" : "Route created"
  );
  const detail = waiting ? "Please wait before trying again. Your selection is saved."
    : message ?? (kind === "empty" ? (emptyKind === "search" ? "Try a different name, street, or phone." : "The stop directory is empty.") : undefined);
  return (
    <View
      style={styles.container}
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: kind === "loading" }}
    >
      {kind === "loading" && (
        <ActivityIndicator
          accessibilityLabel={heading}
          color={theme.colors.primary}
        />
      )}
      <Text
        accessibilityRole={kind === "error" ? "alert" : "header"}
        style={[styles.title, kind === "error" && styles.error]}
      >
        {heading}
      </Text>
      {!!detail && <Text style={styles.message}>{detail}</Text>}
      {actionLabel && onAction && (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: unavailable }}
          disabled={unavailable}
          onPress={() => { if (!unavailable) onAction(); }}
          style={[styles.button, unavailable && styles.disabled]}
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
