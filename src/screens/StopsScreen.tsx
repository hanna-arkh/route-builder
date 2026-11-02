import { useEffect, useMemo, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, SectionList, StyleSheet, Text, TextInput, View } from "react-native";
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
  const stopCount = draft.selected.length;
  const packageCount = draft.selected.reduce((total, item) => total + item.packages, 0);
  const canOpenInstructions = !locked && stopCount > 0;
  const header = (
    <View style={styles.header}>
      <View style={styles.routeHeading}>
        <Text accessibilityRole="header" style={styles.heading}>
          Morning route — Central area
        </Text>
        <Text style={styles.subtitle}>
          {packageCount} {packageCount === 1 ? "package" : "packages"} | {stopCount} {stopCount === 1 ? "stop" : "stops"}
        </Text>
      </View>
      <View accessibilityRole="tablist" style={styles.tabs}>
        <View accessible accessibilityRole="tab" accessibilityLabel="Stops"
          accessibilityState={{ selected: true }} style={[styles.tab, styles.activeTab]}>
          <Text style={styles.activeTabText}>Stops</Text>
        </View>
        <Pressable accessibilityRole="tab" accessibilityLabel="Instructions"
          accessibilityState={{ selected: false, disabled: !canOpenInstructions }}
          disabled={!canOpenInstructions}
          onPress={() => { if (canOpenInstructions) { Keyboard.dismiss(); onContinue(); } }}
          style={styles.tab}>
          <Text style={styles.inactiveTabText}>Instructions</Text>
        </Pressable>
      </View>
      <View style={styles.controls}>
        <View accessibilityRole="radiogroup" style={styles.modes}>
          {(["one", "multi"] as const).map((mode) => (
            <Pressable
              key={mode}
              accessibilityRole="radio"
              accessibilityState={{ checked: draft.mode === mode, disabled: locked }}
              disabled={locked}
              onPress={() => setMode(mode)}
              style={[styles.mode, draft.mode === mode && styles.activeMode, locked && styles.dim]}
            >
              <Text style={[styles.modeTitle, draft.mode === mode && styles.activeModeText]}>
                {mode === "one" ? "One stop" : "Multi-stop route"}
              </Text>
              <Text style={[styles.modeSubtitle, draft.mode === mode && styles.activeModeText]}>
                {mode === "one" ? "Single delivery" : "Several stops"}
              </Text>
            </Pressable>
          ))}
        </View>
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
          {query.length > 0 && (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search"
              accessibilityState={{ disabled: locked }} disabled={locked}
              onPress={() => changeQuery("")} style={styles.clearSearch}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          )}
          <View accessible={false} pointerEvents="none" style={styles.searchIcon}>
            <View style={styles.searchLens} />
            <View style={styles.searchHandle} />
          </View>
        </View>
      </View>
    </View>
  );
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SectionList
        sections={catalogue.status === "ready" ? sections : []}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
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
            showCheckbox={draft.mode === "multi"}
            onSelect={() => toggleStop(item.id)}
            onQuantity={() => setQuantityId(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.state}>
            {catalogue.status === "loading" || catalogue.status === "idle" ? (
              <RequestState kind="loading" title={catalogue.query ? "Searching stops…" : "Loading stops…"} />
            ) : catalogue.status === "error" ? (
              <RequestState kind="error" title="Unable to load stops"
                message={catalogue.error?.kind === "network" ? "Check your connection and try again. Your selection is saved." : catalogue.error?.message}
                retryAt={state.retryAt} actionLabel="Retry" onAction={() => { void loadStops(); }} />
            ) : <RequestState kind="empty" emptyKind={catalogue.query ? "search" : "directory"} />}
          </View>
        }
      />
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
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { backgroundColor: theme.colors.surface },
  routeHeading: { paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  heading: { ...theme.typography.heading, fontWeight: "800", color: theme.colors.text },
  subtitle: { ...theme.typography.caption, color: theme.colors.textSecondary },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tab: { flex: 1, minHeight: 46, padding: 10, alignItems: "center", justifyContent: "center", borderBottomWidth: 3, borderBottomColor: "transparent" },
  activeTab: { borderBottomColor: theme.colors.primary },
  activeTabText: { ...theme.typography.label, color: theme.colors.primary },
  inactiveTabText: { ...theme.typography.label, color: theme.colors.textSecondary },
  controls: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  modes: { flexDirection: "row", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 4 },
  mode: { flex: 1, minHeight: 52, paddingHorizontal: 8, paddingVertical: 7, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  activeMode: { backgroundColor: theme.colors.primary },
  modeTitle: { fontSize: 15, lineHeight: 20, fontWeight: "700", textAlign: "center", color: theme.colors.text },
  modeSubtitle: { fontSize: 11, lineHeight: 15, fontWeight: "400", textAlign: "center", color: theme.colors.textSecondary },
  activeModeText: { color: theme.colors.surface },
  dim: { opacity: 0.45 },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: theme.colors.background,
    ...theme.typography.label,
    color: theme.colors.textSecondary,
  },
  search: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.surface, paddingHorizontal: 14, gap: 8 },
  searchInput: { flex: 1, minHeight: 46, paddingVertical: 10, fontSize: 14, lineHeight: 20, color: theme.colors.text, writingDirection: "ltr", textAlign: "left" },
  searchIcon: { width: 18, height: 18 },
  searchLens: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.6, borderColor: theme.colors.textSecondary },
  searchHandle: { position: "absolute", left: 10, top: 12, width: 8, height: 1.6, backgroundColor: theme.colors.textSecondary, transform: [{ rotate: "45deg" }] },
  clearSearch: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  clearText: { ...theme.typography.label, color: theme.colors.primary },
  content: { flexGrow: 1 },
  state: { flexGrow: 1, minHeight: 180, justifyContent: "center" },
});
