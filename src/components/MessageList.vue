<script setup lang="ts">
import { ref } from "vue";
import type { MessageItem } from "../utils/db";

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
  const firstLine = content.split("\n")[0].trim();
  return firstLine.length > 50 ? firstLine.substring(0, 50) + "..." : firstLine;
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
      <h2>{{ props.title }}</h2>
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
            <span class="icon">{{
              props.title === "Inbox" ? "📥" : "📤"
            }}</span>
            <span class="date">{{ formatDate(msg.timestamp) }}</span>
            <span class="chip-global" v-if="msg.isGlobal">🌍 GLOBAL</span>
          </div>
          <code class="preview" v-if="expandedId !== msg.id">{{
            getPreview(msg.content)
          }}</code>
          <div class="actions">
            <button
              class="btn btn-icon delete-btn"
              @click.stop="emit('delete', msg.id)"
              title="Delete"
            >
              ✖
            </button>
          </div>
        </div>

        <div class="card-content" v-if="expandedId === msg.id">
          <textarea
            class="readonly-editor"
            readonly
            :value="msg.content"
          ></textarea>
          <div class="content-actions">
            <button class="btn btn-sm" @click="copyToClipboard(msg.content)">
              📋 Copy Source
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">{{ props.title === "Inbox" ? "📭" : "💨" }}</div>
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
}

.header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 12px 12px 0 0;
}

.header h2 {
  font-size: 1.25rem;
  margin: 0;
  color: #fff;
}

.count {
  background: var(--surface-hover);
  padding: 0.2rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent-secondary);
}

.list-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-card {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}
.message-card:hover:not(.expanded) {
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.35);
}
.message-card.expanded {
  border-color: var(--accent-color);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.card-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.date {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.chip-global {
  background: rgba(232, 28, 255, 0.2);
  color: #f04dff;
  font-size: 0.65rem;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  border: 1px solid rgba(232, 28, 255, 0.4);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.preview {
  flex: 1;
  font-family: "Fira Code", monospace;
  font-size: 0.85rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.8;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.4rem;
  font-size: 0.8rem;
  background: transparent;
  border: none;
}
.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.card-content {
  border-top: 1px solid var(--surface-border);
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
}

.readonly-editor {
  width: 100%;
  height: 250px;
  resize: vertical;
  background: transparent;
  border: none;
  padding: 1rem;
  font-family: "Fira Code", monospace;
  font-size: 0.95rem;
  color: var(--text-primary);
  outline: none;
  line-height: 1.5;
}

.content-actions {
  padding: 0.75rem 1rem;
  border-top: 1px dashed var(--surface-border);
  display: flex;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.2);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  gap: 1rem;
}
.empty-icon {
  font-size: 3rem;
  opacity: 0.5;
}
</style>
