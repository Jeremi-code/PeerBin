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
      <div class="editor-header-left">
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
          :class="props.isConnected ? 'btn-primary' : ''"
          :disabled="!props.isConnected || !props.modelValue.trim()"
          @click="emit('sendCode', props.modelValue, false)"
          title="Send directly to connected peer"
        >
          <!-- Arrow up-right icon -->
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="7" y1="17" x2="17" y2="7"/>
            <polyline points="7 7 17 7 17 17"/>
          </svg>
          Direct Send
        </button>
        <button
          class="btn btn-sm btn-warm"
          :disabled="!props.modelValue.trim()"
          @click="emit('sendCode', props.modelValue, true)"
          title="Broadcast to all users worldwide"
        >
          <!-- Globe icon -->
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          Global Broadcast
        </button>
      </div>
    </div>

    <div class="accent-line"></div>

    <textarea
      class="editor-textarea"
      :value="props.modelValue"
      @input="handleInput"
      @keydown="handleKeydown"
      placeholder="// Write your code snippet here.&#10;// We automatically detect your language!&#10;// When ready, click 'Direct Send' or 'Global Broadcast'."
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
  padding: 0.7rem 1.1rem;
  background: var(--header-bg);
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.editor-header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.window-controls {
  display: flex;
  gap: 0.4rem;
}

.control {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
.control.close   { background: #ff5f56; }
.control.minimize { background: #ffbd2e; }
.control.maximize { background: #27c93f; }

.filename {
  font-family: "Fira Code", monospace;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.lang-icon { font-size: 0.95rem; }

.header-actions {
  display: flex;
  gap: 0.6rem;
}

/* Thin accent gradient line below header */
.accent-line {
  height: 2px;
  background: linear-gradient(90deg, var(--accent-color), var(--accent-secondary), transparent);
  flex-shrink: 0;
}

.editor-textarea {
  flex: 1;
  width: 100%;
  resize: none;
  background: transparent;
  border: none;
  padding: 1.5rem;
  font-family: "Fira Code", monospace;
  font-size: 0.98rem;
  line-height: 1.7;
  color: var(--text-primary);
  outline: none;
}
.editor-textarea::placeholder {
  color: var(--text-secondary);
  opacity: 0.45;
}
.editor-textarea:focus {
  box-shadow: none;
}
</style>
