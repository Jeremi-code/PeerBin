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

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy", err);
  }
};
</script>

<template>
  <div class="glass-panel connection-panel">
    <div class="header">
      <h2>Online Connection</h2>
      <div class="status-badge" :class="`status-${props.connectionState}`">
        <span class="status-dot"></span>
        {{ props.connectionState.toUpperCase() }}
      </div>
    </div>

    <!-- Active Connection View -->
    <div
      v-if="props.connectionState === 'connected'"
      class="connected-view animate-fade-in"
    >
      <p class="success-text">
        You are connected to a peer. Code changes will sync instantly over the
        internet.
      </p>
      <button class="btn btn-danger mt-3" @click="emit('disconnect')">
        Disconnect
      </button>
    </div>

    <!-- Connecting View -->
    <div
      v-else-if="props.connectionState === 'connecting'"
      class="connected-view animate-fade-in"
    >
      <div class="spinner"></div>
      <p class="text-secondary mt-2">Connecting to peer...</p>
    </div>

    <!-- Disconnected View -->
    <div v-else class="setup-view animate-fade-in">
      <p class="desc">
        Share your 5-character ID with a friend, or connect to theirs over the
        internet.
      </p>

      <div class="step-card">
        <label>Your Peer ID:</label>
        <div class="code-box mt-2">
          <input
            type="text"
            :value="props.peerId || 'Generating...'"
            readonly
          />
          <button
            class="btn"
            @click="copyToClipboard(props.peerId)"
            :disabled="!props.peerId"
          >
            Copy
          </button>
        </div>
      </div>

      <div class="divider">OR</div>

      <div class="step-card">
        <label>Connect to a Peer:</label>
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
  gap: 1.5rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 1rem;
}

.header h2 {
  font-size: 1.25rem;
  color: #fff;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  background: var(--btn-bg);
  border: 1px solid var(--surface-border);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-secondary);
}

.status-connected {
  color: var(--success-color);
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.1);
}
.status-connected .status-dot {
  background: var(--success-color);
  box-shadow: 0 0 10px var(--success-color);
}

.status-connecting {
  color: var(--accent-secondary);
  border-color: rgba(232, 28, 255, 0.3);
  background: rgba(232, 28, 255, 0.1);
}
.status-connecting .status-dot {
  background: var(--accent-secondary);
  box-shadow: 0 0 10px var(--accent-secondary);
  animation: pulse 1.5s infinite;
}

.desc {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 1.5rem;
}

.step-card {
  background: var(--card-bg);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}
.step-card label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent-color);
}

.divider {
  text-align: center;
  margin: 1rem 0;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.mt-2 {
  margin-top: 0.75rem;
}
.mt-3 {
  margin-top: 1rem;
}
.mb-4 {
  margin-bottom: 1.5rem;
}

.code-box,
.input-group {
  display: flex;
  gap: 0.5rem;
}

.code-box input {
  color: var(--accent-secondary);
  font-weight: 700;
  letter-spacing: 2px;
  text-align: center;
}

.connected-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 0;
  text-align: center;
}

.success-text {
  color: var(--success-color);
  font-weight: 500;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--accent-secondary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
