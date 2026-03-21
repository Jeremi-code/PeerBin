<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit("update:modelValue", target.value);
};

const handleKeydown = (event: KeyboardEvent) => {
  // Simple tab handler
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

    // Move cursor asynchronously after DOM updates
    setTimeout(() => {
      target.selectionStart = target.selectionEnd = start + 2;
    }, 0);
  }
};
</script>

<template>
  <div class="editor-container glass-panel">
    <div class="editor-header">
      <div class="window-controls">
        <span class="control close"></span>
        <span class="control minimize"></span>
        <span class="control maximize"></span>
      </div>
      <div class="filename">snippet.txt</div>
    </div>
    <textarea
      class="editor-textarea"
      :value="props.modelValue"
      @input="handleInput"
      @keydown="handleKeydown"
      placeholder="// Share your code here... Offline or Online, it works P2P!"
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
}

.editor-header {
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  gap: 1rem;
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
