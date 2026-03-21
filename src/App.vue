<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import ConnectionPanel from "./components/ConnectionPanel.vue";
import CodeEditor from "./components/CodeEditor.vue";
import MessageList from "./components/MessageList.vue";
import { OnlinePeer, type ConnectState } from "./utils/peer";
import { GlobalRelay } from "./utils/mqtt";
import {
  saveSnippet,
  loadSnippet,
  getMessages,
  saveMessage,
  deleteMessage,
  type MessageItem,
} from "./utils/db";

const SNIPPET_ID = "draft-snippet";

// State
const currentTab = ref<"write" | "inbox" | "sent">("write");
const code = ref("");
const connectionState = ref<ConnectState>("disconnected");
const peerId = ref("");
const inboxMsgs = ref<MessageItem[]>([]);
const sentMsgs = ref<MessageItem[]>([]);
const theme = ref(localStorage.getItem("peerbin_theme") || "dark");
let p2p: OnlinePeer | null = null;
let relay: GlobalRelay | null = null;

// Initialization
onMounted(async () => {
  // Apply visual theme
  document.documentElement.setAttribute("data-theme", theme.value);

  // Load draft from DB
  const savedCode = await loadSnippet(SNIPPET_ID);
  if (savedCode) {
    code.value = savedCode;
  }

  // Load messages
  await fetchMessages();

  // Setup standard Direct PeerJS handling
  p2p = new OnlinePeer({
    onStateChange: (state) => {
      connectionState.value = state;
    },
    onCodeReceived: async (receivedCode, isGlobal) => {
      await saveMessage(receivedCode, "inbox", isGlobal);
      await fetchMessages();
    },
    onIdGenerated: (id) => {
      peerId.value = id;
    },
  });

  p2p.init();

  // Setup Anonymous Global Relay handling
  relay = new GlobalRelay(async (receivedCode) => {
    // When a global message lands from the worldwide channel!
    await saveMessage(receivedCode, "inbox", true);
    await fetchMessages();
  });

  relay.init();
});

// Theme toggler logic
const toggleTheme = () => {
  theme.value = theme.value === "dark" ? "light" : "dark";
  localStorage.setItem("peerbin_theme", theme.value);
  document.documentElement.setAttribute("data-theme", theme.value);
};

// Draft autosave
watch(code, (newCode) => {
  saveSnippet(SNIPPET_ID, newCode);
});

const handleConnect = (targetId: string) => {
  p2p?.connectTo(targetId);
};

const handleDisconnect = () => {
  p2p?.disconnect();
};

const fetchMessages = async () => {
  inboxMsgs.value = await getMessages("inbox");
  sentMsgs.value = await getMessages("sent");
};

const handleSendCode = async (content: string, isGlobal: boolean) => {
  if (content.trim()) {
    if (isGlobal) {
      // Broadcast over the worldwide MQTT channel!
      relay?.broadcast(content);
      await saveMessage(content, "sent", true);
      await fetchMessages();
      currentTab.value = "sent";
    } else if (p2p && connectionState.value === "connected") {
      // Direct send to explicitly connected PeerJS connections
      p2p.sendCode(content, false);
      await saveMessage(content, "sent", false);
      await fetchMessages();
      currentTab.value = "sent";
    }
  }
};

const handleDeleteMessage = async (id: string) => {
  await deleteMessage(id);
  await fetchMessages();
};
</script>

<template>
  <main class="app-layout">
    <header class="app-header glass-panel">
      <div class="logo">
        <img
          src="/logo.png"
          alt="PeerBin Logo"
          class="app-logo-img"
          onerror="
            this.style.display = 'none';
            this.nextElementSibling.style.display = 'inline';
          "
        />
        <span class="logo-icon fallback-icon" style="display: none">🔗</span>
        <h1>PeerBin</h1>
      </div>

      <div class="header-right">
        <p class="tagline">Decentralized Snippet Messenger</p>
        <button
          class="btn btn-icon theme-toggle"
          @click="toggleTheme"
          :title="
            theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'
          "
        >
          {{ theme === "dark" ? "☀️" : "🌙" }}
        </button>
      </div>
    </header>

    <div class="main-content">
      <div class="sidebar">
        <ConnectionPanel
          :connectionState="connectionState"
          :peerId="peerId"
          @connect="handleConnect"
          @disconnect="handleDisconnect"
        />

        <div class="info-panel glass-panel mt-4">
          <h3>P2P Messaging</h3>
          <p>
            PeerBin is now a secure code messenger! Connect to a peer and swap
            snippets seamlessly into each other's Inboxes.
            <br /><br />
            Hit <strong>Global Broadcast</strong> to send a snippet anonymously
            to <em>everyone currently using this app worldwide!</em>
          </p>
        </div>
      </div>

      <div class="workspace-area">
        <div class="tabs-nav glass-panel">
          <button
            class="tab-btn"
            :class="{ active: currentTab === 'write' }"
            @click="currentTab = 'write'"
          >
            ✍️ Sending Now <span v-if="code.trim()" class="draft-dot"></span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: currentTab === 'inbox' }"
            @click="currentTab = 'inbox'"
          >
            📥 Inbox
            <span class="badge" v-if="inboxMsgs.length">{{
              inboxMsgs.length
            }}</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: currentTab === 'sent' }"
            @click="currentTab = 'sent'"
          >
            📤 Sent
            <span class="badge" v-if="sentMsgs.length">{{
              sentMsgs.length
            }}</span>
          </button>
        </div>

        <div class="tab-content" v-show="currentTab === 'write'">
          <CodeEditor
            v-model="code"
            :isConnected="connectionState === 'connected'"
            @sendCode="handleSendCode"
          />
        </div>

        <div class="tab-content" v-show="currentTab === 'inbox'">
          <MessageList
            title="Inbox"
            emptyMessage="Your inbox is empty. Waiting for peers to send you code!"
            :messages="inboxMsgs"
            @delete="handleDeleteMessage"
          />
        </div>

        <div class="tab-content" v-show="currentTab === 'sent'">
          <MessageList
            title="Sent Snippets"
            emptyMessage="You haven't sent any snippets yet."
            :messages="sentMsgs"
            @delete="handleDeleteMessage"
          />
        </div>
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

.app-logo-img {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
}

.logo-icon.fallback-icon {
  font-size: 1.8rem;
  filter: drop-shadow(0 0 8px var(--accent-color));
}

.logo h1 {
  background: linear-gradient(
    135deg,
    var(--text-primary) 0%,
    var(--accent-color) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 1.8rem;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.theme-toggle {
  font-size: 1.2rem;
  padding: 0.4rem;
  border-radius: 50%;
  background: var(--btn-bg);
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}
.theme-toggle:hover {
  background: var(--btn-hover-bg);
  transform: rotate(15deg) scale(1.1);
}

[data-theme="light"] .logo h1 {
  background: linear-gradient(
    135deg,
    var(--accent-color) 0%,
    var(--accent-secondary) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
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
  width: 350px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
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
}

.workspace-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tabs-nav {
  display: flex;
  padding: 0.5rem;
  gap: 0.5rem;
  border-radius: 12px;
}

.tab-btn {
  flex: 1;
  background: transparent;
  color: var(--text-secondary);
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.tab-btn:hover {
  background: rgba(100, 100, 100, 0.1);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--accent-color);
  color: #fff;
  box-shadow: 0 4px 15px var(--accent-glow);
}

.draft-dot {
  width: 6px;
  height: 6px;
  background: #ffbd2e;
  border-radius: 50%;
}

.badge {
  background: var(--badge-bg);
  padding: 0.1rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
}
.tab-btn.active .badge {
  background: var(--badge-active);
}

.tab-content {
  flex: 1;
  min-height: 0;
}

.mt-4 {
  margin-top: 1.5rem;
}
</style>
