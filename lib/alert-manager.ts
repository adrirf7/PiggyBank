import { AlertButton } from "@/components/alert-dialog";

interface AlertState {
  title?: string;
  message?: string;
  buttons: AlertButton[];
  visible: boolean;
  onDismiss?: () => void;
}

let alertStateRef: { state: AlertState; setState: (state: AlertState) => void } | null = null;

export const setAlertStateRef = (ref: { state: AlertState; setState: (state: AlertState) => void }) => {
  alertStateRef = ref;
};

export const showAlert = (title: string, message?: string, buttons?: AlertButton[], onDismiss?: () => void) => {
  if (!alertStateRef) {
    console.warn("AlertDialog not initialized. Make sure AlertDialogProvider is wrapped around your app.");
    return;
  }

  alertStateRef.setState({
    title,
    message,
    buttons: buttons || [{ text: "OK", style: "default" }],
    visible: true,
    onDismiss,
  });
};

export const hideAlert = () => {
  if (alertStateRef) {
    alertStateRef.setState({
      ...alertStateRef.state,
      visible: false,
    });
  }
};
