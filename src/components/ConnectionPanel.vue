<script setup lang="ts">
import { ref, watch } from "vue";
import QRCode from "qrcode";
import { useToast } from "../composables/useToast";

const props = defineProps<{
  connectionState: "disconnected" | "connecting" | "connected";
  peerId: string;
}>();

const emit = defineEmits<{
  (e: "connect", targetId: string): void;
  (e: "disconnect"): void;
}>();

const { show } = useToast();
const targetId = ref("");
const copied = ref(false);
const qrDataUrl = ref<string | null>(null);
const showQr = ref(false);

/** Generate QR code whenever peerId becomes available */
watch(() => props.peerId, async (id) => {
  if (!id) return;
  try {
    qrDataUrl.value = await QRCode.toDataURL(id, {
      width: 160,
      margin: 1,
      color: {
        dark: "#e8654b",
        light: "#130905",
      },
    });
  } catch {
    qrDataUrl.value = null;
  }
}, { immediate: true });

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    show("Peer ID copied!", "success", 2000);
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    show("Failed to copy", "error");
  }
};
</script>

<template>
  <div class="glass-panel connection-panel">
    <div class="header">
      <div class="header-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

    <!-- Connected -->
    <div v-if="props.connectionState === 'connected'" class="connected-view animate-fade-in">
      <div class="connected-icon">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <p class="success-text">Peer connected! Snippets deliver directly.</p>
      <button class="btn btn-danger mt-3" @click="emit('disconnect')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        Disconnect
      </button>
    </div>

    <!-- Connecting -->
    <div v-else-if="props.connectionState === 'connecting'" class="connected-view animate-fade-in">
      <div class="spinner-ring"></div>
      <p class="text-secondary mt-2">Establishing connection…</p>
    </div>

    <!-- Disconnected -->
    <div v-else class="setup-view animate-fade-in">
      <p class="desc">Share your 5-character Peer ID to start exchanging snippets securely.</p>

      <div class="step-card">
        <label>Your Peer ID</label>
        <div class="code-box mt-2">
          <div class="peer-id-display">{{ props.peerId || "Generating…" }}</div>
          <button
            class="btn btn-copy"
            :class="{ copied }"
            @click="copyToClipboard(props.peerId)"
            :disabled="!props.peerId"
          >
            <svg v-if="!copied" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {{ copied ? "Copied!" : "Copy" }}
          </button>
        </div>

        <!-- QR Code Toggle -->
        <div class="qr-row mt-2" v-if="qrDataUrl">
          <button class="btn btn-sm qr-toggle-btn" @click="showQr = !showQr">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            {{ showQr ? "Hide QR" : "Show QR Code" }}
          </button>
        </div>

        <Transition name="qr-fade">
          <div v-if="showQr && qrDataUrl" class="qr-container mt-2">
            <img :src="qrDataUrl" alt="QR code for Peer ID" class="qr-image" />
            <p class="qr-hint">Scan with a mobile device to connect</p>
          </div>
        </Transition>
      </div>

      <div class="divider"><span>or connect to a peer</span></div>

      <div class="step-card">
        <label>Peer's ID</label>
        <div class="input-group mt-2">
          <input
            type="text"
            v-model="targetId"
            placeholder="e.g. A1B2C"
            maxlength="5"
            style="text-transform: uppercase"
            @keyup.enter="targetId && emit('connect', targetId)"
          />
          <button
            class="btn btn-primary"
            @click="emit('connect', targetId)"
            :disabled="!targetId"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
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
  gap: 1.1rem;
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
  text-transform: capitalize;
  color: var(--text-secondary);
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-secondary);
  flex-shrink: 0;
}
.status-connected { color: var(--success-color); border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.1); }
.status-connected .status-dot { background: var(--success-color); box-shadow: 0 0 8px var(--success-color); }
.status-connecting { color: var(--accent-color); border-color: rgba(232,101,75,0.3); background: rgba(232,101,75,0.1); }
.status-connecting .status-dot { background: var(--accent-color); box-shadow: 0 0 8px var(--accent-color); animation: pulse 1.4s infinite; }

@keyframes pulse { 0%,100% { opacity:.5; } 50% { opacity:1; } }

.desc { color: var(--text-secondary); font-size: 0.875rem; line-height: 1.5; }

.step-card {
  background: var(--card-bg);
  padding: 1rem 1.1rem;
  border-radius: 10px;
  border: 1px solid var(--surface-border);
  border-left: 3px solid var(--accent-color);
}
.step-card label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-color);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}
.divider::before,.divider::after { content:""; flex:1; height:1px; background:var(--surface-border); }

.mt-2 { margin-top: 0.65rem; }
.mt-3 { margin-top: 1rem; }

.code-box, .input-group { display: flex; gap: 0.5rem; align-items: center; }

.peer-id-display {
  flex: 1;
  font-family: "Fira Code", monospace;
  font-size: clamp(0.9rem, 4vw, 1.1rem);
  font-weight: 700;
  letter-spacing: 4px;
  text-align: center;
  color: var(--accent-color);
  background: var(--input-bg);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 0.6rem 0.5rem;
  overflow-wrap: break-word;
  word-break: break-all;
}

.btn-copy {
  padding: 0.6rem 0.85rem;
  white-space: nowrap;
  font-size: 0.8rem;
  gap: 0.4rem;
}
.btn-copy.copied {
  background: rgba(16,185,129,0.15);
  border-color: rgba(16,185,129,0.4);
  color: var(--success-color);
}

/* QR Code */
.qr-row { display: flex; }
.qr-toggle-btn {
  font-size: 0.78rem;
  padding: 0.35rem 0.75rem;
  gap: 0.4rem;
  border-color: rgba(232,101,75,0.3);
  color: var(--accent-color);
}
.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem; 
  background: var(--input-bg);
  border-radius: 10px;
  border: 1px solid var(--surface-border);
}
.qr-image {
  width: 130px;
  height: 130px;
  border-radius: 8px;
  image-rendering: pixelated;
}
.qr-hint {
  font-size: 0.72rem;
  color: var(--text-secondary);
  opacity: 0.65;
  text-align: center;
}

/* QR transition */
.qr-fade-enter-active,.qr-fade-leave-active { transition: all 0.25s ease; }
.qr-fade-enter-from,.qr-fade-leave-to { opacity:0; transform:translateY(-6px); }

.connected-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  padding: 1.75rem 0;
  text-align: center;
}
.connected-icon {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: rgba(16,185,129,0.12);
  border: 2px solid rgba(16,185,129,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--success-color);
}
.success-text { color: var(--success-color); font-weight: 500; font-size: 0.875rem; max-width: 210px; line-height: 1.5; }
.text-secondary { color: var(--text-secondary); font-size: 0.875rem; }

.spinner-ring {
  width: 38px;
  height: 38px;
  border: 3px solid var(--surface-border);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
