<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  connectionState: "disconnected" | "connecting" | "connected";
  peerId: string;
}>();

const emit = defineEmits<{
  (e: "connect", targetId: string): void;
  (e: "disconnect"): void;
}>();

const targetId = ref("");
const copied = ref(false);

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch (err) {
    console.error("Failed to copy", err);
  }
};
</script>

<template>
  <div class="glass-panel connection-panel">
    <div class="header">
      <div class="header-title">
        <!-- Wifi/signal icon -->
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
          <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
          <line x1="12" y1="20" x2="12.01" y2="20"/>
        </svg>
        Connection
      </div>
      <div class="status-badge" :class="`status-${props.connectionState}`">
        <span class="status-dot"></span>
        {{ props.connectionState }}
      </div>
    </div>

    <!-- Active Connection View -->
    <div
      v-if="props.connectionState === 'connected'"
      class="connected-view animate-fade-in"
    >
      <div class="connected-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <p class="success-text">Peer connected! Snippets will deliver directly.</p>
      <button class="btn btn-danger mt-3" @click="emit('disconnect')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        Disconnect
      </button>
    </div>

    <!-- Connecting View -->
    <div
      v-else-if="props.connectionState === 'connecting'"
      class="connected-view animate-fade-in"
    >
      <div class="spinner-ring"></div>
      <p class="text-secondary mt-2">Establishing peer connection…</p>
    </div>

    <!-- Disconnected View -->
    <div v-else class="setup-view animate-fade-in">
      <p class="desc">
        Share your 5-character ID or connect to a friend's to start exchanging snippets.
      </p>

      <div class="step-card">
        <label>Your Peer ID</label>
        <div class="code-box mt-2">
          <div class="peer-id-display">{{ props.peerId || "Generating…" }}</div>
          <button
            class="btn btn-copy"
            :class="{ copied: copied }"
            @click="copyToClipboard(props.peerId)"
            :disabled="!props.peerId"
          >
            <!-- Copy icon -->
            <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <!-- Check icon -->
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {{ copied ? "Copied!" : "Copy" }}
          </button>
        </div>
      </div>

      <div class="divider">
        <span>or connect to a peer</span>
      </div>

      <div class="step-card">
        <label>Peer's ID</label>
        <div class="input-group mt-2">
          <input
            type="text"
            v-model="targetId"
            placeholder="e.g. A1B2C"
            @keyup.enter="targetId && emit('connect', targetId)"
          />
          <button
            class="btn btn-primary"
            @click="emit('connect', targetId)"
            :disabled="!targetId"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
            Connect
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.connection-panel {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 1rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.28rem 0.7rem;
  border-radius: 20px;
  background: var(--btn-bg);
  border: 1px solid var(--surface-border);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-secondary);
  flex-shrink: 0;
}

.status-connected {
  color: var(--success-color);
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.1);
}
.status-connected .status-dot {
  background: var(--success-color);
  box-shadow: 0 0 8px var(--success-color);
}

.status-connecting {
  color: var(--accent-color);
  border-color: rgba(232, 101, 75, 0.3);
  background: rgba(232, 101, 75, 0.1);
}
.status-connecting .status-dot {
  background: var(--accent-color);
  box-shadow: 0 0 8px var(--accent-color);
  animation: pulse 1.4s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.desc {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
}

.step-card {
  background: var(--card-bg);
  padding: 1rem 1.1rem;
  border-radius: 10px;
  border: 1px solid var(--surface-border);
  border-left: 3px solid var(--accent-color);
}
.step-card label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--accent-color);
  text-transform: uppercase;
  letter-spacing: 0.7px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.divider::before,
.divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--surface-border);
}

.mt-2 { margin-top: 0.65rem; }
.mt-3 { margin-top: 1rem; }

.code-box,
.input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.peer-id-display {
  flex: 1;
  font-family: "Fira Code", monospace;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 4px;
  text-align: center;
  color: var(--accent-color);
  background: var(--input-bg);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 0.65rem 1rem;
}

.btn-copy {
  padding: 0.65rem 1rem;
  white-space: nowrap;
  font-size: 0.85rem;
  gap: 0.4rem;
}
.btn-copy.copied {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.4);
  color: var(--success-color);
}

.connected-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
  padding: 2rem 0;
  text-align: center;
}

.connected-icon {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.12);
  border: 2px solid rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--success-color);
}

.success-text {
  color: var(--success-color);
  font-weight: 500;
  font-size: 0.9rem;
  max-width: 220px;
  line-height: 1.5;
}

.text-secondary {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.spinner-ring {
  width: 40px;
  height: 40px;
  border: 3px solid var(--surface-border);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
