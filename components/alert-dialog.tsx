import { Colors } from "@/constants/theme";
import { setAlertStateRef } from "@/lib/alert-manager";
import React, { useState } from "react";
import { Modal, Pressable, SafeAreaView, Text, View } from "react-native";

export interface AlertButton {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: "default" | "cancel" | "destructive";
}

interface AlertState {
  title?: string;
  message?: string;
  buttons: AlertButton[];
  visible: boolean;
  onDismiss?: () => void;
}

export function AlertDialogProvider({ children }: { children: React.ReactNode }) {
  const [alertState, setAlertState] = useState<AlertState>({
    title: undefined,
    message: undefined,
    buttons: [],
    visible: false,
    onDismiss: undefined,
  });

  // Set the global ref when component mounts
  React.useEffect(() => {
    setAlertStateRef({ state: alertState, setState: setAlertState });
  }, [alertState]);

  return (
    <>
      {children}
      <AlertDialogComponent state={alertState} setState={setAlertState} />
    </>
  );
}

interface AlertDialogComponentProps {
  state: AlertState;
  setState: (state: AlertState) => void;
}

function AlertDialogComponent({ state, setState }: AlertDialogComponentProps) {
  const theme = Colors.dark;
  const [isLoading, setIsLoading] = useState(false);

  const handleDismiss = () => {
    state.onDismiss?.();
    setState({ ...state, visible: false });
  };

  const handleButtonPress = async (button: AlertButton) => {
    setIsLoading(true);
    try {
      if (button.onPress) {
        const result = button.onPress();
        if (result instanceof Promise) {
          await result;
        }
      }
    } finally {
      setIsLoading(false);
      handleDismiss();
    }
  };

  const cancelButton = state.buttons.find((b) => b.style === "cancel");
  const otherButtons = state.buttons.filter((b) => b.style !== "cancel");

  return (
    <Modal visible={state.visible} transparent animationType="fade" onRequestClose={handleDismiss} statusBarTranslucent>
      <SafeAreaView
        className="flex-1 justify-center items-center px-4"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <View
          className="w-full max-w-xs rounded-3xl overflow-hidden"
          style={{
            backgroundColor: theme.card,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 10,
          }}
        >
          {/* Header */}
          {(state.title || state.message) && (
            <View className="px-6 pt-6 pb-2">
              {state.title && (
                <Text className="text-lg font-bold mb-2" style={{ color: theme.text }}>
                  {state.title}
                </Text>
              )}
              {state.message && (
                <Text className="text-sm leading-5" style={{ color: theme.muted }}>
                  {state.message}
                </Text>
              )}
            </View>
          )}

          {/* Buttons */}
          <View className="mt-4 px-6 pb-6">
            {otherButtons.length > 0 && (
              <View className="gap-2.5">
                {otherButtons.map((button, index) => (
                  <Pressable
                    key={index}
                    disabled={isLoading}
                    onPress={() => handleButtonPress(button)}
                    className={`rounded-xl py-3 items-center justify-center ${isLoading ? "opacity-50" : "active:opacity-70"}`}
                    style={{
                      backgroundColor: button.style === "destructive" ? "#EF4444" : "#c9e259",
                    }}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{
                        color: button.style === "destructive" ? "#fff" : "#0F172A",
                      }}
                    >
                      {button.text}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {cancelButton && (
              <Pressable
                disabled={isLoading}
                onPress={() => handleButtonPress(cancelButton)}
                className={`rounded-xl py-3 items-center justify-center ${otherButtons.length > 0 ? "mt-2" : ""} ${isLoading ? "opacity-50" : "active:opacity-70"}`}
                style={{
                  backgroundColor: theme.buttonSecondary,
                }}
              >
                <Text className="text-sm font-semibold" style={{ color: theme.text }}>
                  {cancelButton.text}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
