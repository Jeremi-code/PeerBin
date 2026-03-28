<script setup lang="ts">
import { computed, ref } from "vue";
import { detectLanguage } from "../utils/language";
import { formatCode } from "../utils/formatter";
import { useToast } from "../composables/useToast";

const props = defineProps<{
  modelValue: string;
  isConnected: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "sendCode", value: string, isGlobal: boolean): void;
}>();

const { show } = useToast();
const isFormatting = ref(false);

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit("update:modelValue", target.value);
};

const handleKeydown = async (event: KeyboardEvent) => {
  // Tab → insert 2 spaces
  if (event.key === "Tab") {
    event.preventDefault();
    const target = event.target as HTMLTextAreaElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    emit(
      "update:modelValue",
      props.modelValue.substring(0, start) + "  " + props.modelValue.substring(end),
    );
    setTimeout(() => {
      target.selectionStart = target.selectionEnd = start + 2;
    }, 0);
    return;
  }

  // Ctrl/Cmd + Enter → Direct send (if connected)
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    if (props.isConnected && props.modelValue.trim()) {
      emit("sendCode", props.modelValue, false);
      show("Snippet sent to peer!", "success");
    }
    return;
  }

  // Ctrl/Cmd + Shift + F → Format
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "f") {
    event.preventDefault();
    await handleFormat();
    return;
  }

  // Ctrl/Cmd + S → Save reminder (already auto-saved, but show toast)
  if ((event.ctrlKey || event.metaKey) && event.key === "s") {
    event.preventDefault();
    show("Draft auto-saved!", "info", 1800);
    return;
  }
};

const handleFormat = async () => {
  if (!props.modelValue.trim() || isFormatting.value) return;
  isFormatting.value = true;
  const lang = detectLanguage(props.modelValue);
  const { result, error } = await formatCode(props.modelValue, lang.name);
  isFormatting.value = false;
  if (error) {
    show(`Format failed: ${error.split("\n")[0]}`, "error");
  } else if (result !== props.modelValue) {
    emit("update:modelValue", result);
    show("Code formatted!", "success");
  } else {
    show("Already formatted ✓", "info", 1800);
  }
};

const handleDownload = () => {
  const lang = detectLanguage(props.modelValue);
  const filename = `snippet.${lang.extension}`;
  const blob = new Blob([props.modelValue], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  show(`Downloaded as ${filename}`, "success");
};

const langInfo = computed(() => detectLanguage(props.modelValue));

// Stats
const lineCount = computed(() => {
  if (!props.modelValue) return 0;
  return props.modelValue.split("\n").length;
});
const charCount = computed(() => props.modelValue.length);
const wordCount = computed(() => {
  if (!props.modelValue.trim()) return 0;
  return props.modelValue.trim().split(/\s+/).length;
});

// Supports formatting
const canFormat = computed(() => {
  const supported = ["JavaScript", "TypeScript", "HTML", "CSS", "SCSS", "JSON", "Markdown"];
  return supported.includes(langInfo.value.name);
});
</script>

<template>
  <div class="editor-container glass-panel">
    <!-- Header -->
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
        <!-- Format button -->
        <button
          class="btn btn-sm btn-format"
          :class="{ spinning: isFormatting }"
          :disabled="!props.modelValue.trim() || !canFormat || isFormatting"
          @click="handleFormat"
          :title="canFormat ? 'Format code (Ctrl+Shift+F)' : `No formatter for ${langInfo.name}`"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" :class="{ 'spin-icon': isFormatting }">
            <polyline points="4 7 4 4 20 4"/>
            <line x1="9" y1="20" x2="20" y2="20"/>
            <line x1="14" y1="12" x2="20" y2="12"/>
            <polyline points="4 11 4 21"/>
          </svg>
          {{ isFormatting ? "…" : "Format" }}
        </button>

        <!-- Download button -->
        <button
          class="btn btn-sm"
          :disabled="!props.modelValue.trim()"
          @click="handleDownload"
          title="Download as file"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>

        <!-- Direct Send -->
        <button
          class="btn btn-sm"
          :class="props.isConnected ? 'btn-primary' : ''"
          :disabled="!props.isConnected || !props.modelValue.trim()"
          @click="emit('sendCode', props.modelValue, false); show('Snippet sent to peer!', 'success')"
          title="Send directly to peer (Ctrl+Enter)"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="7" y1="17" x2="17" y2="7"/>
            <polyline points="7 7 17 7 17 17"/>
          </svg>
          Direct Send
        </button>

        <!-- Global Broadcast -->
        <button
          class="btn btn-sm btn-warm"
          :disabled="!props.modelValue.trim()"
          @click="emit('sendCode', props.modelValue, true); show('Broadcasted globally!', 'warning')"
          title="Broadcast to all users worldwide"
        >
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

    <!-- Keyboard shortcuts hint -->
    <div class="shortcuts-bar" v-if="!props.modelValue">
      <span>⌘+Enter <em>send</em></span>
      <span>⌘⇧F <em>format</em></span>
      <span>Tab <em>indent</em></span>
      <span>⌘S <em>saved</em></span>
    </div>

    <textarea
      class="editor-textarea"
      :value="props.modelValue"
      @input="handleInput"
      @keydown="handleKeydown"
      placeholder="// Write your code snippet here.&#10;// Language auto-detected. Format with Ctrl+Shift+F.&#10;// Send with Ctrl+Enter (direct) or use buttons above."
      spellcheck="false"
    ></textarea>

    <!-- Status bar -->
    <div class="status-bar">
      <div class="status-left">
        <span class="status-lang">
          {{ langInfo.icon }} {{ langInfo.name }}
        </span>
        <span v-if="canFormat" class="status-formattable">Prettier</span>
      </div>
      <div class="status-right">
        <span>{{ lineCount }} line{{ lineCount !== 1 ? 's' : '' }}</span>
        <span class="status-sep">·</span>
        <span>{{ wordCount }} word{{ wordCount !== 1 ? 's' : '' }}</span>
        <span class="status-sep">·</span>
        <span>{{ charCount }} char{{ charCount !== 1 ? 's' : '' }}</span>
      </div>
    </div>
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
  padding: 0.65rem 1rem;
  background: var(--header-bg);
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  gap: 0.75rem;
}

.editor-header-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-shrink: 0;
}

.window-controls {
  display: flex;
  gap: 0.4rem;
}
.control { width: 11px; height: 11px; border-radius: 50%; }
.control.close    { background: #ff5f56; }
.control.minimize { background: #ffbd2e; }
.control.maximize { background: #27c93f; }

.filename {
  font-family: "Fira Code", monospace;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.lang-icon { font-size: 0.95rem; }

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: nowrap;
  overflow: hidden;
}

.accent-line {
  height: 2px;
  background: linear-gradient(90deg, var(--accent-color), var(--accent-secondary), transparent 80%);
  flex-shrink: 0;
}

/* Format button */
.btn-format {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
}
.btn-format:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.2);
  border-color: #818cf8;
}
.spin-icon {
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Shortcuts hint bar */
.shortcuts-bar {
  display: flex;
  gap: 1.25rem;
  padding: 0.4rem 1.5rem;
  background: var(--header-bg);
  border-bottom: 1px solid var(--surface-border);
  flex-shrink: 0;
}
.shortcuts-bar span {
  font-family: "Fira Code", monospace;
  font-size: 0.72rem;
  color: var(--text-secondary);
  opacity: 0.55;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.shortcuts-bar em {
  font-style: normal;
  opacity: 0.7;
}

.editor-textarea {
  flex: 1;
  width: 100%;
  resize: none;
  background: transparent;
  border: none;
  padding: 1.25rem 1.5rem;
  font-family: "Fira Code", monospace;
  font-size: 0.97rem;
  line-height: 1.75;
  color: var(--text-primary);
  outline: none;
  min-height: 0;
}
.editor-textarea::placeholder {
  color: var(--text-secondary);
  opacity: 0.4;
}
.editor-textarea:focus { box-shadow: none; }

/* Status bar at bottom */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.32rem 1rem;
  background: var(--header-bg);
  border-top: 1px solid var(--surface-border);
  flex-shrink: 0;
  font-size: 0.72rem;
  color: var(--text-secondary);
  opacity: 0.75;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.status-lang {
  font-family: "Fira Code", monospace;
  font-weight: 600;
  color: var(--accent-color);
}
.status-formattable {
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  border-radius: 5px;
  border: 1px solid rgba(99, 102, 241, 0.25);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-family: "Fira Code", monospace;
}
.status-sep { opacity: 0.4; }
</style>
