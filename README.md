<div align="center">
  <img src="public/logo.png" alt="PeerBin Logo" width="100"/>
  <h1>PeerBin</h1>
  <p><strong>Decentralized, Serverless P2P Code Snippet Messenger</strong></p>
</div>

<br/>

PeerBin is a real-time, completely serverless application built for developers to securely and instantly swap code snippets across the internet or local networks using **WebRTC (PeerJS)** and a **Worldwide MQTT Broker**. It features a premium desktop-class UI with intelligent language detection and bulletproof local offline storage.

## ✨ Features

- 🚀 **Direct P2P Encrypted Sending:** Connect to a peer using a short randomized 5-character ID and drop code snippets directly into their Inbox securely over WebRTC.
- 🌍 **Anonymous Worldwide Broadcasting:** Using a built-in public MQTT WebSocket relay (`test.mosquitto.org`), you can instantly blast a code snippet to *everyone* currently using the app worldwide!
- 💾 **Bulletproof Local Storage:** Your Drafts, Inbox, and Sent messages are 100% persisted directly inside your browser's IndexedDB. Your history survives hard-refreshes and offline sessions.
- 🎨 **Auto-Language Detection:** The active editor analyzes the code you type in real-time, automatically calculating the exact programming language (JS, Python, Rust, HTML, etc.), assigning the correct file extension and rendering an appropriate icon (`⚡ snippet.js`).
- 💎 **Premium Code Viewer:** All received snippets are run through `highlight.js` to render beautifully formatted, fully syntax-highlighted blocks matching the renowned *Atom One Dark* theme.
- 🌓 **Deep Theme Engine:** Support for a premium, custom Glassmorphism Dark Mode (Default) and an ultra-high-contrast Light Mode workspace, complete with smooth transitions.

## 🛠 Tech Stack

- **Framework**: Vue 3 + Vite
- **P2P Networking**: `peerjs` (Browser-to-Browser WebRTC Data Channels)
- **Global Networking**: `mqtt` (Public WebSocket Brokers)
- **Local Persistence**: IndexedDB (Native Browser Storage)
- **Syntax Highlighting**: `highlight.js`
- **Styling**: Vanilla CSS with full CSS Custom Property scaling

## 🚀 Getting Started

This project is built extremely lean. Since it is entirely serverless and relies on public relays and P2P handshakes, **no backend database or server installation is required.**

### Prerequisites
Make sure you have Node or Bun installed on your machine.

### Installation

1. **Clone & Install Dependencies**
```bash
npm install
# or
bun install
```

2. **Start the Development Server**
```bash
npm run dev
# or
bun run dev
```

3. **Open the App**
Navigate to `http://localhost:5474` (or your Vite console output URL).

## 💡 How to Test Local Features
1. Open two separate browser tabs/windows side-by-side. 
2. In Tab A, copy your generated **Peer ID**. 
3. In Tab B, paste that ID into `Connect to a peer` and click **Connect**.
4. Type a script and hit **Direct Send**. Watch it instantly route to the other tab's **📥 Inbox**, permanently saving it locally!
5. **No connection active?** Hit **🌍 Global Broadcast** and see your code instantly reflect in any active PeerBin tab globally.

---
*Built from scratch with zero backend lock-in.*
