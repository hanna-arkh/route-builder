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
  compact = false,
}: {
  kind: "idle" | "loading" | "error" | "empty" | "success";
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
  retryAt?: number | null;
  emptyKind?: "directory" | "search";
  compact?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (retryAt === null) return;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (retryAt > currentTime) timer = setTimeout(refresh, Math.min(retryAt - currentTime + 1, 1000));
    };
    timer = setTimeout(refresh, 0);
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") { clearTimeout(timer); refresh(); }
    });
    return () => { clearTimeout(timer); subscription.remove(); };
  }, [retryAt]);
  const waiting = retryAt !== null && retryAt > now;
  const unavailable = disabled || waiting;
  const remaining = retryAt === null ? 0 : Math.max(0, Math.ceil((retryAt - now) / 1000));
  const heading = waiting ? "Waiting to retry" : title ?? (
    kind === "idle" ? null : kind === "empty" ? (emptyKind === "search" ? "No stop found" : "No stops available")
      : kind === "loading" ? "Loading stops…" : kind === "error" ? "Unable to load stops" : "Route created"
  );
  const detail = message ?? (kind === "empty" ? (emptyKind === "search" ? "Try a different name, street, or phone." : "The stop directory is empty.") : undefined);
  return (
    <View
      style={[styles.container, compact && styles.compact]}
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: kind === "loading" }}
    >
      {kind === "loading" && (
        <ActivityIndicator
          accessibilityLabel={heading ?? "Loading"}
          color={theme.colors.primary}
        />
      )}
      {!!heading && <Text
        accessibilityRole={kind === "error" ? "alert" : "header"}
        style={[styles.title, kind === "error" && styles.error]}
      >
        {heading}
      </Text>}
      {!!detail && <Text style={styles.message}>{detail}</Text>}
      {waiting && <Text style={styles.message}>Retry available in {remaining} {remaining === 1 ? "second" : "seconds"}.</Text>}
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
  compact: { padding: 0 },
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
