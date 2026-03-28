<script setup lang="ts">
import { ref } from "vue";
import type { MessageItem } from "../utils/db";
import { detectLanguage, highlightCode } from "../utils/language";

const props = defineProps<{
  messages: MessageItem[];
  title: string;
  emptyMessage: string;
}>();

const emit = defineEmits<{
  (e: "delete", id: string): void;
}>();

const expandedId = ref<string | null>(null);

const formatDate = (ts: number) => {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getPreview = (content: string) => {
  const firstLine = (content.split("\n")[0] || "").trim();
  return firstLine.length > 55 ? firstLine.substring(0, 55) + "…" : firstLine;
};

const toggleExpand = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id;
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy", err);
  }
};
</script>

<template>
  <div class="message-list-container glass-panel">
    <div class="header">
      <div class="header-title">
        <!-- Inbox icon -->
        <svg v-if="props.title === 'Inbox'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
        </svg>
        <!-- Send icon -->
        <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        {{ props.title }}
      </div>
      <span class="count">{{ props.messages.length }}</span>
    </div>

    <div class="list-body" v-if="props.messages.length > 0">
      <div
        v-for="msg in props.messages"
        :key="msg.id"
        class="message-card"
        :class="{ expanded: expandedId === msg.id }"
      >
        <div class="card-header" @click="toggleExpand(msg.id)">
          <div class="card-meta">
            <span class="date">{{ formatDate(msg.timestamp) }}</span>
            <span class="chip-global" v-if="msg.isGlobal">
              <!-- Globe mini icon -->
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              GLOBAL
            </span>
            <span class="lang-pill" v-if="expandedId !== msg.id">
              {{ detectLanguage(msg.content).name }}
            </span>
          </div>
          <code class="preview" v-if="expandedId !== msg.id">{{ getPreview(msg.content) }}</code>
          <div class="actions">
            <button
              class="btn btn-icon delete-btn"
              @click.stop="emit('delete', msg.id)"
              title="Delete"
            >
              <!-- X icon -->
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="card-content" v-if="expandedId === msg.id">
          <div class="code-viewer-header">
            <span class="lang-label">
              {{ detectLanguage(msg.content).icon }}
              {{ detectLanguage(msg.content).name }}
            </span>
          </div>
          <div class="code-scroll-area">
            <pre><code class="hljs" v-html="highlightCode(msg.content)"></code></pre>
          </div>
          <div class="content-actions">
            <button class="btn btn-sm" @click="copyToClipboard(msg.content)">
              <!-- Copy icon -->
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy Source
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <!-- Empty inbox icon -->
      <div class="empty-icon">
        <svg v-if="props.title === 'Inbox'" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
        </svg>
        <svg v-else width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </div>
      <p>{{ props.emptyMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.message-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  animation: fadeIn 0.3s ease-out;
  overflow: hidden;
}

.header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--header-bg);
  border-radius: 14px 14px 0 0;
  flex-shrink: 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.count {
  background: var(--badge-bg);
  padding: 0.15rem 0.7rem;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--accent-color);
  border: 1px solid var(--surface-border);
}

.list-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.message-card {
  background: var(--card-bg);
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.2s;
}
.message-card:hover:not(.expanded) {
  border-color: rgba(232, 101, 75, 0.25);
  background: var(--card-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(66, 22, 13, 0.2);
}
.message-card.expanded {
  border-color: var(--accent-color);
  box-shadow: 0 4px 24px var(--accent-glow);
}

.card-header {
  padding: 0.85rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.date {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.chip-global {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(232, 101, 75, 0.15);
  color: var(--accent-color);
  font-size: 0.62rem;
  padding: 0.18rem 0.5rem;
  border-radius: 10px;
  border: 1px solid rgba(232, 101, 75, 0.35);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.lang-pill {
  background: var(--badge-bg);
  color: var(--accent-secondary);
  font-size: 0.65rem;
  padding: 0.18rem 0.5rem;
  border-radius: 6px;
  font-weight: 600;
  border: 1px solid var(--surface-border);
}

.preview {
  flex: 1;
  font-family: "Fira Code", monospace;
  font-size: 0.82rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.75;
  min-width: 0;
}

.actions {
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
}

.btn-icon {
  width: 30px;
  height: 30px;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.delete-btn:hover {
  background: rgba(244, 63, 94, 0.15);
  border-color: rgba(244, 63, 94, 0.3);
  color: var(--danger-color);
}

.card-content {
  border-top: 1px solid var(--surface-border);
  background: var(--content-bg);
  display: flex;
  flex-direction: column;
}

.code-viewer-header {
  padding: 0.45rem 1rem;
  background: var(--code-header-bg);
  font-size: 0.78rem;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.lang-label {
  color: var(--accent-color);
}

.code-scroll-area {
  max-height: 320px;
  overflow-y: auto;
  padding: 1rem;
}
.code-scroll-area pre {
  margin: 0;
  background: transparent;
}
.code-scroll-area code {
  font-family: "Fira Code", monospace;
  font-size: 0.9rem;
  line-height: 1.55;
}

.content-actions {
  padding: 0.65rem 1rem;
  border-top: 1px dashed var(--surface-border);
  display: flex;
  justify-content: flex-end;
  background: var(--header-bg);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  gap: 1rem;
  opacity: 0.5;
}
.empty-icon {
  color: var(--accent-color);
}
.empty-state p {
  font-size: 0.9rem;
  text-align: center;
  max-width: 260px;
  line-height: 1.5;
}
</style>
