import { ref } from "vue";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration: number;
}

const toasts = ref<Toast[]>([]);

export function useToast() {
  function show(
    message: string,
    type: Toast["type"] = "info",
    duration = 3000,
  ) {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, message, type, duration };
    toasts.value.push(toast);
    setTimeout(() => dismiss(id), duration);
    return id;
  }

  function dismiss(id: string) {
    const idx = toasts.value.findIndex((t) => t.id === id);
    if (idx !== -1) toasts.value.splice(idx, 1);
  }

  return { toasts, show, dismiss };
}
