import { useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { InstructionCard } from "../components/InstructionCard";
import { RequestState } from "../components/RequestState";
import { theme } from "../components/theme";
import { useRouteBuilder } from "../context/RouteBuilderContext";
import { draftIsLocked } from "../context/routeBuilderReducer";

export function InstructionsScreen({
  onBack,
  onNewRoute,
}: {
  onBack: () => void;
  onNewRoute: () => void;
}) {
  const { state, setInstructions, clearInstructions, submit } =
    useRouteBuilder();
  const { submission, draft } = state;
  const locked = draftIsLocked(state);
  const [now, setNow] = useState(() => Date.now());
  // Enable a manual retry after the server's deadline; never submit on a timer.
  useEffect(() => {
    const currentTime = Date.now();
    if (!state.retryAt) return;
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.max(0, Math.min(state.retryAt - currentTime + 1, 2147483647)),
    );
    return () => clearTimeout(timer);
  }, [state.retryAt]);
  const coolingDown = (state.retryAt ?? 0) > now;
  const errors =
    submission.status === "idle" || submission.status === "error"
      ? submission.validation.errorsByStopId
      : {};
  const finish = () => {
    Keyboard.dismiss();
    void submit();
  };
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: locked }}
          disabled={locked}
          onPress={() => {
            Keyboard.dismiss();
            onBack();
          }}
          style={styles.back}
        >
          <Text style={[styles.link, locked && styles.dim]}>
            ‹ Back to Stops
          </Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.heading}>
          Instructions
        </Text>
        <Text style={styles.subtitle}>Add instructions for every stop</Text>
      </View>
      <FlatList
        data={draft.selected}
        keyExtractor={(item) => item.stop.id}
        extraData={submission}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        renderItem={({ item }) => (
          <InstructionCard
            item={item}
            error={errors[item.stop.id]}
            disabled={locked}
            onChange={(text) => setInstructions(item.stop.id, text)}
            onClear={() => clearInstructions(item.stop.id)}
          />
        )}
      />
      <SafeAreaView edges={{ bottom: "maximum" }} style={styles.footer}>
        {submission.status === "success" ? (
          <RequestState
            kind="success"
            title="Route created"
            message={`Route ID: ${submission.route.id}`}
            actionLabel="New route"
            onAction={onNewRoute}
          />
        ) : submission.status === "unknown" ? (
          <RequestState
            kind="error"
            title="Route outcome unknown"
            message="Your route may already have been created. Your instructions are saved. Do not send it again without checking for a duplicate."
          />
        ) : (
          <>
            {submission.status === "error" && (
              <RequestState
                kind="error"
                title="Route was not created"
                message={
                  coolingDown
                    ? "Please wait before trying again. Your instructions are saved."
                    : "Your instructions are saved. Check your connection or details and try again."
                }
              />
            )}
            {submission.status === "idle" &&
              submission.validation.routeError && (
                <Text accessibilityRole="alert" style={styles.error}>
                  {submission.validation.routeError}
                </Text>
              )}
            {submission.status === "sending" ? (
              <RequestState kind="loading" title="Creating route…" />
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: locked || coolingDown }}
                disabled={locked || coolingDown}
                onPress={finish}
                style={[styles.finish, (locked || coolingDown) && styles.dim]}
              >
                <Text style={styles.finishText}>
                  {submission.status === "error"
                    ? "Retry"
                    : "Finish instructions"}
                </Text>
              </Pressable>
            )}
          </>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  back: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  link: { ...theme.typography.label, color: theme.colors.primary },
  heading: { ...theme.typography.heading, color: theme.colors.text },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  list: { padding: 16, gap: 12 },
  footer: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  finish: {
    minHeight: 52,
    padding: 14,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  finishText: { ...theme.typography.label, color: theme.colors.surface },
  dim: { opacity: 0.45 },
  error: { color: theme.colors.errorText, ...theme.typography.body },
});
