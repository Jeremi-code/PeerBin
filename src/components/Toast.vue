<script setup lang="ts">
import { useToast, type Toast } from "../composables/useToast";

const { toasts, dismiss } = useToast();

const icons: Record<Toast["type"], string> = {
  success: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  error: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  warning: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast-${toast.type}`"
          @click="dismiss(toast.id)"
        >
          <span class="toast-icon" v-html="icons[toast.type]"></span>
          <span class="toast-msg">{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1.1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  pointer-events: all;
  cursor: pointer;
  max-width: 340px;
  animation: slideIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: 'Outfit', sans-serif;
}

.toast-success {
  background: rgba(16, 185, 129, 0.18);
  border-color: rgba(16, 185, 129, 0.35);
  color: #34d399;
}
.toast-error {
  background: rgba(244, 63, 94, 0.18);
  border-color: rgba(244, 63, 94, 0.35);
  color: #fb7185;
}
.toast-warning {
  background: rgba(232, 101, 75, 0.18);
  border-color: rgba(232, 101, 75, 0.35);
  color: #f8b6a9;
}
.toast-info {
  background: rgba(59, 130, 246, 0.18);
  border-color: rgba(59, 130, 246, 0.35);
  color: #93c5fd;
}

.toast-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(24px) scale(0.95); }
  to   { opacity: 1; transform: translateX(0) scale(1); }
}

/* TransitionGroup */
.toast-enter-active { animation: slideIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { animation: slideIn 0.2s ease reverse; }
.toast-move { transition: transform 0.25s ease; }
</style>
