<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  isConnected: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "sendCode", value: string): void;
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
        <div class="filename">draft_snippet.ts</div>
      </div>

      <div class="header-actions">
        <button
          class="btn btn-sm"
          :class="props.isConnected ? 'btn-primary' : 'btn-disabled'"
          :disabled="!props.isConnected || !props.modelValue.trim()"
          @click="emit('sendCode', props.modelValue)"
        >
          🚀 Send to Peer
        </button>
      </div>
    </div>
    <textarea
      class="editor-textarea"
      :value="props.modelValue"
      @input="handleInput"
      @keydown="handleKeydown"
      placeholder="// Write your code snippet here.&#10;// When ready, click 'Send to Peer' to drop it into their Inbox!"
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
  color: var(--text-secondary);
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
