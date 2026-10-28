import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { theme } from './src/components/theme';
import { apiConfig } from './src/config/api';
import { RouteBuilderProvider, useRouteBuilder } from './src/context/RouteBuilderContext';

// Temporary T014 runtime/HTTP diagnostic. Replaced by the two screens in T023.
function FoundationDiagnostic() {
  const { state: { catalogue }, loadStops } = useRouteBuilder();
  useEffect(() => { void loadStops(); }, [loadStops]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Route Builder — connection check</Text>
        <Text selectable style={styles.text}>API: {apiConfig.baseUrl}</Text>
        {catalogue.status === 'loading' && <ActivityIndicator accessibilityLabel="Loading stops" />}
        {catalogue.status === 'ready' && (
          <Text style={styles.text}>Loaded {catalogue.results.length} unique stops</Text>
        )}
        {catalogue.error && <Text accessibilityRole="alert" style={styles.error}>{catalogue.error.message}</Text>}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: catalogue.status === 'loading' }}
          disabled={catalogue.status === 'loading'}
          style={styles.button}
          onPress={() => { void loadStops({ force: true }); }}
        >
          <Text style={styles.buttonText}>Retry connection</Text>
        </Pressable>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <RouteBuilderProvider><FoundationDiagnostic /></RouteBuilderProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    direction: theme.layout.direction,
  },
  content: { padding: theme.spacing.screen, gap: theme.spacing.xl },
  heading: { ...theme.typography.heading, color: theme.colors.text },
  text: { ...theme.typography.body, color: theme.colors.text },
  error: { ...theme.typography.body, color: theme.colors.errorText },
  button: {
    minHeight: theme.layout.minTouchTarget, minWidth: theme.layout.minTouchTarget,
    backgroundColor: theme.colors.primary, borderRadius: theme.radii.button,
    alignItems: 'center', justifyContent: 'center', padding: theme.spacing.md,
  },
  buttonText: { ...theme.typography.label, color: theme.colors.surface },
});
