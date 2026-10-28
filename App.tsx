import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { theme } from "./src/components/theme";
import {
  RouteBuilderProvider,
  useRouteBuilder,
} from "./src/context/RouteBuilderContext";
import { InstructionsScreen } from "./src/screens/InstructionsScreen";
import { StopsScreen } from "./src/screens/StopsScreen";

function RouteBuilder() {
  const [screen, setScreen] = useState<"stops" | "instructions">("stops");
  const { state, newRoute, isInteractionLocked } = useRouteBuilder();
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
      {screen === "stops" ? (
        <StopsScreen
          onContinue={() => {
            if (!isInteractionLocked() && state.draft.selected.length > 0)
              setScreen("instructions");
          }}
        />
      ) : (
        <InstructionsScreen
          onBack={() => {
            if (!isInteractionLocked()) setScreen("stops");
          }}
          onNewRoute={() => {
            if (state.submission.status !== "success") return;
            newRoute();
            setScreen("stops");
          }}
        />
      )}
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <RouteBuilderProvider>
        <RouteBuilder />
      </RouteBuilderProvider>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    direction: "ltr",
  },
});
