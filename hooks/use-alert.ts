import { AlertButton } from "@/components/alert-dialog";
import { showAlert as showAlertDialog } from "@/lib/alert-manager";
import { useCallback } from "react";

export function useAlert() {
  const alert = useCallback((title: string, message?: string, buttons?: AlertButton[], onDismiss?: () => void) => {
    showAlertDialog(title, message, buttons, onDismiss);
  }, []);

  return { alert };
}
