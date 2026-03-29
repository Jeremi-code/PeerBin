<script setup lang="ts">
import { ref } from "vue";
import type { MessageItem } from "../utils/db";
import { detectLanguage, highlightCode } from "../utils/language";
import { useToast } from "../composables/useToast";

const props = defineProps<{
  messages: MessageItem[];
  title: string;
  emptyMessage: string;
}>();

const emit = defineEmits<{
  (e: "delete", id: string): void;
  (e: "deleteAll"): void;
}>();

const { show } = useToast();
const expandedId = ref<string | null>(null);

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
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
    show("Source copied to clipboard!", "success", 2000);
  } catch (err) {
    show("Failed to copy", "error");
  }
};

const handleDeleteAll = () => {
  if (confirm(`Are you sure you want to delete all messages in ${props.title}?`)) {
    emit("deleteAll");
    show(`All messages in ${props.title} deleted`, "warning");
  }
};
</script>

<template>
  <div class="message-list-container glass-panel">
    <div class="header">
      <div class="header-left">
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

      <button
        v-if="props.messages.length > 0"
        class="btn btn-icon delete-all-btn has-tooltip"
        data-tooltip="Delete All Messages"
        @click="handleDeleteAll"
        title="Delete All Messages"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>
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
              class="btn btn-icon delete-btn has-tooltip"
              data-tooltip="Delete message"
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
          <!-- Premium Integrated Code Viewer -->
          <div class="code-art-container">
            <div class="code-art-header">
              <div class="art-lang">
                <span class="art-icon">{{ detectLanguage(msg.content).icon }}</span>
                {{ detectLanguage(msg.content).name }}
              </div>
              <div class="art-actions">
                <button class="btn-art" @click="copyToClipboard(msg.content)" title="Copy Source">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copy
                </button>
                <button class="btn-art btn-collapse" @click="expandedId = null" title="Collapse">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="code-viewport">
               <pre><code class="hljs" v-html="highlightCode(msg.content)"></code></pre>
            </div>

            <!-- Footer accent -->
            <div class="code-art-footer">
              Snippet received at {{ formatDate(msg.timestamp) }}
            </div>
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
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--header-bg);
  border-radius: 14px 14px 0 0;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.count {
  background: var(--badge-bg);
  padding: 0.12rem 0.6rem;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--accent-color);
  border: 1px solid var(--surface-border);
}

.delete-all-btn {
  opacity: 0.6;
  transition: all 0.2s;
}
.delete-all-btn:hover {
  opacity: 1;
  background: rgba(244, 63, 94, 0.12);
  color: var(--danger-color);
  border-color: rgba(244, 63, 94, 0.25);
}

.list-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.message-card {
  background: var(--card-bg);
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.message-card:hover:not(.expanded) {
  border-color: rgba(232, 101, 75, 0.3);
  background: var(--card-hover);
  transform: translateY(-1px);
}
.message-card.expanded {
  border-color: var(--accent-color);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  background: rgba(232, 101, 75, 0.02);
  margin: 0.25rem 0;
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
  gap: 0.45rem;
  flex-shrink: 0;
}

.date {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.chip-global {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(232, 101, 75, 0.12);
  color: var(--accent-color);
  font-size: 0.6rem;
  padding: 0.15rem 0.45rem;
  border-radius: 8px;
  border: 1px solid rgba(232, 101, 75, 0.25);
  font-weight: 700;
  letter-spacing: 0.4px;
}

.lang-pill {
  background: var(--badge-bg);
  color: var(--accent-secondary);
  font-size: 0.62rem;
  padding: 0.15rem 0.45rem;
  border-radius: 5px;
  font-weight: 600;
  border: 1px solid var(--surface-border);
}

.preview {
  flex: 1;
  font-family: "Fira Code", monospace;
  font-size: 0.8rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.6;
  min-width: 0;
}

.actions {
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
}

.btn-icon {
  width: 28px;
  height: 28px;
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
  background: rgba(244, 63, 94, 0.12);
  border-color: rgba(244, 63, 94, 0.2);
  color: var(--danger-color);
}

/* Creative Code Viewer */
.card-content {
  border-top: 1px solid var(--surface-border);
  padding: 0.65rem;
  background: rgba(0, 0, 0, 0.1);
}

.code-art-container {
  /* Darker, more solid background to reduce conflict with dot-grid */
  background: #1a0b06; 
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(232, 101, 75, 0.2);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.code-art-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem 1.1rem;
  background: linear-gradient(to right, rgba(232, 101, 75, 0.12), rgba(232, 101, 75, 0.03));
  border-bottom: 1px solid rgba(232, 101, 75, 0.1);
}

.art-lang {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--accent-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.art-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-art {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(232, 101, 75, 0.25);
  color: var(--text-secondary);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.25s;
  text-transform: uppercase;
}
.btn-art:hover {
  background: rgba(232, 101, 75, 0.15);
  border-color: var(--accent-color);
  color: var(--accent-color);
  transform: translateY(-1.5px);
  box-shadow: 0 4px 12px rgba(232, 101, 75, 0.1);
}

.btn-collapse {
  padding: 0.25rem 0.5rem;
}

.code-viewport {
  max-height: 550px;
  overflow: auto;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.15);
}
.code-viewport code {
  font-family: "Fira Code", monospace;
  font-size: 0.92rem;
  line-height: 1.7;
  color: #fdf5f3; /* explicit text-primary for high contrast */
}

.code-art-footer {
  padding: 0.5rem 1.1rem;
  font-size: 0.65rem;
  color: var(--text-secondary);
  opacity: 0.45;
  text-align: right;
  border-top: 1px solid rgba(232, 101, 75, 0.08);
  background: rgba(0, 0, 0, 0.2);
  font-weight: 600;
  letter-spacing: 0.3px;
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

@media (max-width: 640px) {
  .preview { display: none; }
  .code-viewport { padding: 0.85rem; }
  .code-viewport code { font-size: 0.82rem; }
}
</style>
