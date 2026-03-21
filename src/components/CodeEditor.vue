<script setup lang="ts">
import { computed } from "vue";
import { detectLanguage } from "../utils/language";

const props = defineProps<{
  modelValue: string;
  isConnected: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "sendCode", value: string, isGlobal: boolean): void;
}>();

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit("update:modelValue", target.value);
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Tab") {
    event.preventDefault();
    const target = event.target as HTMLTextAreaElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const value = target.value;

    emit(
      "update:modelValue",
      value.substring(0, start) + "  " + value.substring(end),
    );

    setTimeout(() => {
      target.selectionStart = target.selectionEnd = start + 2;
    }, 0);
  }
};

const langInfo = computed(() => detectLanguage(props.modelValue));
</script>

<template>
  <div class="editor-container glass-panel">
    <div class="editor-header">
      <div style="display: flex; align-items: center; gap: 1rem">
        <div class="window-controls">
          <span class="control close"></span>
          <span class="control minimize"></span>
          <span class="control maximize"></span>
        </div>
        <div class="filename">
          <span class="lang-icon">{{ langInfo.icon }}</span>
          snippet.{{ langInfo.extension }}
        </div>
      </div>

      <div class="header-actions">
        <button
          class="btn btn-sm"
          :class="props.isConnected ? 'btn-primary' : 'btn-disabled'"
          :disabled="!props.isConnected || !props.modelValue.trim()"
          @click="emit('sendCode', props.modelValue, false)"
          title="Send specifically to Peer"
        >
          🚀 Direct Send
        </button>
        <button
          class="btn btn-sm btn-warning"
          :disabled="!props.modelValue.trim()"
          @click="emit('sendCode', props.modelValue, true)"
          title="Broadcast to Global Channel"
        >
          🌍 Global Broadcast
        </button>
      </div>
    </div>
    <textarea
      class="editor-textarea"
      :value="props.modelValue"
      @input="handleInput"
      @keydown="handleKeydown"
      placeholder="// Write your code snippet here.&#10;// We automatically detect your language!&#10;// When ready, click 'Direct Send' or 'Global Broadcast' to route it."
      spellcheck="false"
    ></textarea>
  </div>
</template>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  animation: fadeIn 0.3s ease-out;
}

.editor-header {
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.window-controls {
  display: flex;
  gap: 0.4rem;
}

.control {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.control.close {
  background: #ff5f56;
}
.control.minimize {
  background: #ffbd2e;
}
.control.maximize {
  background: #27c93f;
}

.filename {
  font-family: "Fira Code", monospace;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.lang-icon {
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-disabled {
  background: rgba(255, 255, 255, 0.05);
  cursor: not-allowed;
  opacity: 0.5;
}

.btn-warning {
  background: var(--accent-secondary);
  border-color: var(--accent-secondary);
  box-shadow: 0 0 15px rgba(232, 28, 255, 0.4);
}
.btn-warning:hover:not(:disabled) {
  background: #f04dff;
  box-shadow: 0 0 25px rgba(232, 28, 255, 0.6);
}

.editor-textarea {
  flex: 1;
  width: 100%;
  resize: none;
  background: transparent;
  border: none;
  padding: 1.5rem;
  font-family: "Fira Code", monospace;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-primary);
  outline: none;
}
.editor-textarea:focus {
  box-shadow: none;
}
</style>
