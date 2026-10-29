import { useEffect, useMemo, useState } from "react";
import { Keyboard, Pressable, SectionList, StyleSheet, Text, TextInput, View } from "react-native";
import { PackageQuantityModal } from "../components/PackageQuantityModal";
import { RequestState } from "../components/RequestState";
import { SelectionTray } from "../components/SelectionTray";
import { StopRow } from "../components/StopRow";
import { theme } from "../components/theme";
import { useRouteBuilder } from "../context/RouteBuilderContext";
import { draftIsLocked } from "../context/routeBuilderReducer";
import type { Stop } from "../types/domain";

export function StopsScreen({ onContinue }: { onContinue: () => void }) {
  const { state, loadStops, toggleStop, savePackages, setMode, search } =
    useRouteBuilder();
  const [quantityId, setQuantityId] = useState<string | null>(null);
  const { catalogue, draft } = state;
  const locked = draftIsLocked(state);
  const [query, setQuery] = useState(catalogue.query);
  const changeQuery = (text: string) => {
    if (locked) return;
    setQuery(text);
    search(text);
  };
  useEffect(() => {
    void loadStops();
  }, [loadStops]);
  const sections = useMemo(() => {
    const groups = new Map<string, Stop[]>();
    const sorted = [...catalogue.results].sort(
      (a, b) =>
        a.name.localeCompare(b.name, "en", { sensitivity: "base" }) ||
        a.id.localeCompare(b.id),
    );
    for (const stop of sorted) {
      const first = stop.name.trim().charAt(0).toUpperCase();
      const letter = /^[A-Z]$/.test(first) ? first : "#";
      groups.set(letter, [...(groups.get(letter) ?? []), stop]);
    }
    return [...groups]
      .sort(([a], [b]) =>
        a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b, "en"),
      )
      .map(([title, data]) => ({ title, data }));
  }, [catalogue.results]);
  const quantityItem = draft.selected.find(
    (item) => item.stop.id === quantityId,
  );
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.heading}>
          Route Builder
        </Text>
        <Text style={styles.subtitle}>1. Stops / 2. Instructions</Text>
        <View accessibilityRole="radiogroup" style={styles.modes}>
          {(["one", "multi"] as const).map((mode) => (
            <Pressable
              key={mode}
              accessibilityRole="radio"
              accessibilityState={{
                checked: draft.mode === mode,
                disabled: locked,
              }}
              disabled={locked}
              onPress={() => setMode(mode)}
              style={[
                styles.mode,
                draft.mode === mode && styles.activeMode,
                locked && styles.dim,
              ]}
            >
              <Text
                style={[
                  styles.modeTitle,
                  draft.mode === mode && styles.activeModeTitle,
                ]}
              >
                {mode === "one" ? "One stop" : "Multi-stop route"}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.subtitle}>
          {draft.mode === "one"
            ? "Select a delivery address"
            : "Select delivery addresses"}
        </Text>
        <View style={styles.search}>
          <TextInput
            accessibilityLabel="Search stops"
            accessibilityHint="Search by name, street, or phone"
            accessibilityState={{ disabled: locked }}
            editable={!locked}
            value={query}
            onChangeText={changeQuery}
            placeholder="Search by name, street, or phone"
            placeholderTextColor={theme.colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            style={styles.searchInput}
          />
          {query.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Clear search"
            accessibilityState={{ disabled: locked }} disabled={locked}
            onPress={() => changeQuery("")} style={styles.clearSearch}>
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>}
        </View>
      </View>
      {catalogue.status === "loading" || catalogue.status === "idle" ? (
        <View style={styles.state}>
          <RequestState kind="loading" title={catalogue.query ? "Searching stops…" : "Loading stops…"} />
        </View>
      ) : catalogue.status === "error" ? (
        <View style={styles.state}>
          <RequestState
            kind="error"
            title="Unable to load stops"
            message={catalogue.error?.kind === "network"
              ? "Check your connection and try again. Your selection is saved."
              : catalogue.error?.message ?? "Check your connection and try again."}
            retryAt={state.retryAt}
            actionLabel="Retry"
            onAction={() => {
              void loadStops();
            }}
          />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          extraData={draft.selected}
          stickySectionHeadersEnabled
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderSectionHeader={({ section }) => (
            <Text accessibilityRole="header" style={styles.section}>
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <StopRow
              stop={item}
              packages={
                draft.selected.find((selected) => selected.stop.id === item.id)
                  ?.packages
              }
              disabled={locked}
              onSelect={() => toggleStop(item.id)}
              onQuantity={() => setQuantityId(item.id)}
            />
          )}
          ListEmptyComponent={
            <RequestState
              kind="empty"
              emptyKind={catalogue.query ? "search" : "directory"}
            />
          }
        />
      )}
      <SelectionTray
        selected={draft.selected}
        disabled={locked}
        onContinue={onContinue}
      />
      {quantityItem && (
        <PackageQuantityModal
          key={quantityItem.stop.id}
          item={quantityItem}
          disabled={locked}
          onClose={() => setQuantityId(null)}
          onSave={(quantity) => {
            savePackages(quantityItem.stop.id, quantity);
            setQuantityId(null);
          }}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { padding: 16, gap: 8, backgroundColor: theme.colors.surface },
  heading: { ...theme.typography.heading, color: theme.colors.text },
  subtitle: { ...theme.typography.body, color: theme.colors.textSecondary },
  modes: { flexDirection: "row", gap: 8 },
  mode: {
    flex: 1,
    minHeight: 52,
    justifyContent: "center",
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  activeMode: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.selected,
  },
  modeTitle: { ...theme.typography.label, color: theme.colors.textSecondary },
  activeModeTitle: { color: theme.colors.primary },
  dim: { opacity: 0.45 },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: theme.colors.background,
    ...theme.typography.label,
    color: theme.colors.textSecondary,
  },
  search: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, backgroundColor: theme.colors.card, paddingHorizontal: 12 },
  searchInput: { flex: 1, minHeight: 44, paddingVertical: 10, ...theme.typography.body, color: theme.colors.text, writingDirection: "ltr", textAlign: "left" },
  clearSearch: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  clearText: { ...theme.typography.label, color: theme.colors.primary },
  state: { flex: 1, justifyContent: "center" },
});
