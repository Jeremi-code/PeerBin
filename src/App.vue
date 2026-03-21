<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import ConnectionPanel from "./components/ConnectionPanel.vue";
import CodeEditor from "./components/CodeEditor.vue";
import { P2PConnection } from "./utils/webrtc";
import { saveSnippet, loadSnippet } from "./utils/db";

const SNIPPET_ID = "default-snippet";

// State
const code = ref("");
const connectionState = ref<"disconnected" | "connecting" | "connected">(
  "disconnected",
);
const localOffer = ref("");
const localAnswer = ref("");
let p2p: P2PConnection | null = null;
let ignoreNextWatch = false;

// Initialization
onMounted(async () => {
  // Load initial code from DB
  const savedCode = await loadSnippet(SNIPPET_ID);
  if (savedCode) {
    code.value = savedCode;
  }

  // Setup P2P handlers
  p2p = new P2PConnection({
    onStateChange: (state) => {
      connectionState.value = state;
    },
    onCodeReceived: (receivedCode) => {
      ignoreNextWatch = true;
      code.value = receivedCode;
      saveSnippet(SNIPPET_ID, receivedCode);
    },
    onLocalOffer: (offerBase64) => {
      localOffer.value = offerBase64;
    },
    onLocalAnswer: (answerBase64) => {
      localAnswer.value = answerBase64;
    },
  });
});

// Sync changes
watch(code, (newCode) => {
  saveSnippet(SNIPPET_ID, newCode);

  if (ignoreNextWatch) {
    ignoreNextWatch = false;
    return;
  }

  if (p2p && connectionState.value === "connected") {
    p2p.sendCode(newCode);
  }
});

// P2P Workflow Handlers
const handleCreateOffer = async () => {
  localOffer.value = "";
  localAnswer.value = "";
  await p2p?.createOffer();
};

const handleAcceptOffer = async (offerStr: string) => {
  localOffer.value = ""; // Clean host flow state if re-used
  localAnswer.value = "";
  await p2p?.acceptOffer(offerStr);
};

const handleAcceptAnswer = async (answerStr: string) => {
  await p2p?.acceptAnswer(answerStr);
};

const handleDisconnect = () => {
  p2p?.disconnect();
  localOffer.value = "";
  localAnswer.value = "";
};
</script>

<template>
  <main class="app-layout">
    <header class="app-header glass-panel">
      <div class="logo">
        <span class="logo-icon">🔗</span>
        <h1>PeerBin</h1>
      </div>
      <p class="tagline">Decentralized P2P Code Sharing</p>
    </header>

    <div class="main-content">
      <div class="sidebar">
        <ConnectionPanel
          :connectionState="connectionState"
          :localOffer="localOffer"
          :localAnswer="localAnswer"
          @createOffer="handleCreateOffer"
          @acceptOffer="handleAcceptOffer"
          @acceptAnswer="handleAcceptAnswer"
          @disconnect="handleDisconnect"
        />

        <div class="info-panel glass-panel mt-4">
          <h3>How it works</h3>
          <p>
            PeerBin connects two browsers directly using WebRTC. Because it uses
            manual signaling, it works <strong>perfectly offline</strong>
            on your local network!
          </p>
          <ul class="features">
            <li>✓ Auto-saves locally (IndexedDB)</li>
            <li>✓ Zero-server P2P Syncing</li>
            <li>✓ Private & Encrypted</li>
          </ul>
        </div>
      </div>

      <div class="editor-area">
        <CodeEditor v-model="code" />
      </div>
    </div>
  </main>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 1.5rem;
  gap: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  font-size: 1.8rem;
  filter: drop-shadow(0 0 8px var(--accent-color));
}

.logo h1 {
  background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 1.8rem;
  margin: 0;
}

.tagline {
  color: var(--text-secondary);
  font-weight: 500;
  letter-spacing: 0.5px;
}

.main-content {
  display: flex;
  flex: 1;
  gap: 1.5rem;
  height: calc(100% - 100px);
}

.sidebar {
  width: 380px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}

.editor-area {
  flex: 1;
  min-width: 0;
  height: 100%;
}

.info-panel {
  padding: 1.5rem;
}

.info-panel h3 {
  font-size: 1rem;
  color: var(--accent-secondary);
  margin-bottom: 0.75rem;
}

.info-panel p {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 1rem;
}

.features {
  list-style: none;
  font-size: 0.85rem;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mt-4 {
  margin-top: 1.5rem;
}
</style>
