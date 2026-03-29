<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import ConnectionPanel from "./components/ConnectionPanel.vue";
import CodeEditor from "./components/CodeEditor.vue";
import MessageList from "./components/MessageList.vue";
import Toast from "./components/Toast.vue";
import { OnlinePeer, type ConnectState } from "./utils/peer";
import { GlobalRelay } from "./utils/mqtt";
import {
  saveSnippet,
  loadSnippet,
  getMessages,
  saveMessage,
  deleteMessage,
  clearMessages,
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
  document.documentElement.setAttribute("data-theme", theme.value);

  const savedCode = await loadSnippet(SNIPPET_ID);
  if (savedCode) {
    code.value = savedCode;
  }

  await fetchMessages();

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

  relay = new GlobalRelay(async (receivedCode) => {
    await saveMessage(receivedCode, "inbox", true);
    await fetchMessages();
  });

  relay.init();
});

const toggleTheme = () => {
  theme.value = theme.value === "dark" ? "light" : "dark";
  localStorage.setItem("peerbin_theme", theme.value);
  document.documentElement.setAttribute("data-theme", theme.value);
};

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
      relay?.broadcast(content);
      await saveMessage(content, "sent", true);
      await fetchMessages();
      currentTab.value = "sent";
    } else if (p2p && connectionState.value === "connected") {
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

const handleClearMessages = async (type: "inbox" | "sent") => {
  await clearMessages(type);
  await fetchMessages();
};
</script>

<template>
  <Toast />
  <main class="app-layout">
    <header class="app-header glass-panel">
      <div class="logo">
        <img
          src="/logo.png"
          alt="PeerBin Logo"
          class="app-logo-img"
          onerror="this.style.display='none';this.nextElementSibling.style.display='inline'"
        />
        <span class="logo-icon fallback-icon" style="display:none">🔗</span>
        <h1>PeerBin</h1>
      </div>

      <div class="header-right">
        <p class="tagline">Decentralized Snippet Messenger</p>
        
        <a 
          href="https://github.com/jeremi-code/peer-bin" 
          target="_blank" 
          class="github-btn has-tooltip"
          rel="noopener noreferrer"
          data-tooltip="View source on GitHub"
          aria-label="View source on GitHub"
        >
          <svg
            class="theme-github-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            width="20"
            height="20"
          >
            <path
              fill="currentColor"
              d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
            />
          </svg>
        </a>

        <button
          class="btn btn-icon theme-toggle"
          @click="toggleTheme"
          :title="theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <!-- Sun icon -->
          <svg v-if="theme === 'dark'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <!-- Moon icon -->
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
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
          <div class="info-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            P2P Messaging
          </div>
          <p>
            Connect to a peer and swap snippets directly into each other's Inboxes.
            <br /><br />
            Use <strong>Global Broadcast</strong> to send anonymously to
            <em>everyone worldwide!</em>
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
            <!-- Pen icon -->
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Compose
            <span v-if="code.trim()" class="draft-dot"></span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: currentTab === 'inbox' }"
            @click="currentTab = 'inbox'"
          >
            <!-- Inbox icon -->
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
            </svg>
            Inbox
            <span class="badge" v-if="inboxMsgs.length">{{ inboxMsgs.length }}</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: currentTab === 'sent' }"
            @click="currentTab = 'sent'"
          >
            <!-- Send icon -->
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Sent
            <span class="badge" v-if="sentMsgs.length">{{ sentMsgs.length }}</span>
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
            @deleteAll="handleClearMessages('inbox')"
          />
        </div>

        <div class="tab-content" v-show="currentTab === 'sent'">
          <MessageList
            title="Sent Snippets"
            emptyMessage="You haven't sent any snippets yet."
            :messages="sentMsgs"
            @delete="handleDeleteMessage"
            @deleteAll="handleClearMessages('sent')"
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
  padding: 1.25rem;
  gap: 1.25rem;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1.75rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.app-logo-img {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  object-fit: cover;
  /* Tint the logo with a warm Thunderbird overlay using mix-blend */
  box-shadow: 0 4px 16px var(--accent-glow), 0 0 0 2px rgba(232, 101, 75, 0.2);
  flex-shrink: 0;
  filter: hue-rotate(0deg) saturate(1.1);
}

.logo-icon.fallback-icon {
  font-size: 1.9rem;
  filter: drop-shadow(0 0 10px var(--accent-color));
}

.logo h1 {
  background: linear-gradient(
    135deg,
    var(--text-primary) 0%,
    var(--accent-color) 60%,
    var(--accent-secondary) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 1.75rem;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tagline {
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.9rem;
  letter-spacing: 0.3px;
  opacity: 0.8;
  margin-right: 0.5rem;
}

.theme-toggle {
  width: 38px;
  height: 38px;
  padding: 0;
  border-radius: 50%;
  background: var(--btn-bg);
  border: 1px solid var(--surface-border);
  color: var(--accent-color);
  cursor: pointer;
  transition: all 0.25s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.theme-toggle:hover {
  background: var(--btn-hover-bg);
  border-color: var(--accent-color);
  transform: rotate(20deg) scale(1.1);
  box-shadow: 0 0 14px var(--accent-glow);
}

.github-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: var(--accent-color);
  background: var(--btn-bg);
  border: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  cursor: pointer;
  text-decoration: none;
}

.github-btn:hover {
  background: var(--btn-hover-bg);
  border-color: var(--accent-color);
  transform: scale(1.1);
  box-shadow: 0 0 14px var(--accent-glow);
}

.github-btn svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
  opacity: 0.9;
  transition: opacity 0.2s;
}

.github-btn:hover svg {
  opacity: 1;
}

[data-theme="light"] .logo h1 {
  background: linear-gradient(
    135deg,
    var(--accent-deep) 0%,
    var(--accent-color) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.main-content {
  display: flex;
  flex: 1;
  gap: 1.25rem;
  min-height: 0;
}

.sidebar {
  width: 340px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.info-panel {
  padding: 1.25rem 1.5rem;
}

.info-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent-color);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 0.75rem;
}

.info-panel p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
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
  padding: 0.4rem;
  gap: 0.35rem;
  border-radius: 12px;
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  background: transparent;
  color: var(--text-secondary);
  border: none;
  padding: 0.65rem 0.75rem;
  border-radius: 9px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  font-family: inherit;
}

.tab-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--accent-color);
  color: #fff;
  box-shadow: 0 4px 18px var(--accent-glow);
}

.draft-dot {
  width: 6px;
  height: 6px;
  background: #fcd34d;
  border-radius: 50%;
  flex-shrink: 0;
}

.badge {
  background: rgba(255, 255, 255, 0.25);
  padding: 0.1rem 0.45rem;
  border-radius: 10px;
  font-size: 0.72rem;
  font-weight: 700;
}
.tab-btn:not(.active) .badge {
  background: var(--badge-bg);
  color: var(--accent-color);
}

.tab-content {
  flex: 1;
  min-height: 0;
}

.mt-4 {
  margin-top: 1.25rem;
}
</style>
