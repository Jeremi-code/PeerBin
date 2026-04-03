import Peer, { type DataConnection } from "peerjs";

export type ConnectState = "disconnected" | "connecting" | "connected";

interface PeerEvents {
  onStateChange: (state: ConnectState) => void;
  onCodeReceived: (code: string, isGlobal: boolean) => void;
  onIdGenerated: (id: string) => void;
  onConnectionError: (error: string) => void;
}

export class OnlinePeer {
  private peer: Peer | null = null;
  private conns: Map<string, DataConnection> = new Map();
  private events: PeerEvents;
  private connectionTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private isResetting = false;
  private currentId: string | null = null;

  constructor(events: PeerEvents) {
    this.events = events;
  }

  public init(forceNewId = false) {
    if (this.isResetting && !forceNewId) return;
    this.isResetting = true;

    // Clean up previous instance before creating a new one
    if (this.peer) {
      console.log("🧹 Destroying previous Peer instance...");
      this.peer.destroy();
      this.peer = null;
    }

    if (forceNewId || !this.currentId) {
      this.currentId = Math.random().toString(36).substring(2, 7).toUpperCase();
    }

    console.log("🚀 Initializing PeerJS with ID:", this.currentId);
    
    this.peer = new Peer(this.currentId, {
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          { urls: "stun:stun.cloudflare.com:3478" },
          { urls: "stun:stun.stunprotocol.org:3478" },
          { urls: "stun:stun.framasoft.org:3478" },
          {
            urls: "turn:global.relay.metered.ca:80",
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_CREDENTIAL,
          },
          {
            urls: "turn:global.relay.metered.ca:80?transport=tcp",
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_CREDENTIAL,
          },
          {
            urls: "turn:global.relay.metered.ca:443",
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_CREDENTIAL,
          },
          {
            urls: "turns:global.relay.metered.ca:443?transport=tcp",
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_CREDENTIAL,
          },
        ],
      },
    });

    this.peer.on("open", (id) => {
      console.log("🟢 PeerJS signaling connection opened with ID:", id);
      this.isResetting = false;
      this.currentId = id;
      this.events.onIdGenerated(id);
      this.events.onStateChange("disconnected");
    });

    this.peer.on("disconnected", () => {
      if (this.isResetting) return;
      console.warn("🟡 PeerJS disconnected from signaling server. Attempting to reconnect...");
      // Try to reconnect while keeping the ID
      this.peer?.reconnect();
    });

    this.peer.on("connection", (connection) => {
      this.setupConnection(connection);
    });

    this.peer.on("error", (err) => {
      console.error("❌ PeerJS error:", err.type, err);
      
      if (err.type === "unavailable-id") {
        console.warn("⚠️ This Peer ID is already taken. Generating a new one...");
        this.init(true);
      } else if (err.type === "network" || err.type === "server-error") {
        if (this.isResetting) return;
        console.error("📡 Signaling network error. Attempting full reset in 5 seconds...");
        this.isResetting = true;
        setTimeout(() => {
          this.isResetting = false;
          this.init(false); // Retain ID if possible during full reset
        }, 5000);
      } else if (err.type === "peer-unavailable") {
        console.error("🚫 Target peer is not online or ID is incorrect.");
      }
    });
  }

  private setupConnection(connection: DataConnection) {
    this.conns.set(connection.peer, connection);
    this.events.onStateChange("connecting");

    const timeoutId = setTimeout(() => {
      if (connection.open) return;
      console.warn(`Connection to ${connection.peer} timed out.`);
      this.events.onConnectionError(
        `Failed to connect to ${connection.peer}. Your networks might be shielded by strict firewalls.`
      );
      connection.close();
    }, 12000);
    this.connectionTimeouts.set(connection.peer, timeoutId);

    connection.on("open", () => {
      clearTimeout(this.connectionTimeouts.get(connection.peer));
      this.connectionTimeouts.delete(connection.peer);
      this.events.onStateChange("connected");
    });

    connection.on("data", (data) => {
      if (typeof data === "string") {
        try {
          const parsed = JSON.parse(data);
          this.events.onCodeReceived(parsed.content, parsed.isGlobal);
        } catch {
          this.events.onCodeReceived(data, false);
        }
      }
    });

    connection.on("close", () => {
      this.handleCleanup(connection.peer);
    });

    connection.on("error", (err) => {
      console.error("Connection error", err);
      this.events.onConnectionError("Connection lost or failed to establish.");
      this.handleCleanup(connection.peer);
    });
  }

  private handleCleanup(peerId: string) {
    clearTimeout(this.connectionTimeouts.get(peerId));
    this.connectionTimeouts.delete(peerId);
    this.conns.delete(peerId);
    if (this.conns.size === 0) {
      this.events.onStateChange("disconnected");
    }
  }

  public connectTo(targetId: string) {
    if (!this.peer || this.peer.destroyed) {
      this.init();
      return;
    }
    const connection = this.peer.connect(targetId.toUpperCase(), {
      reliable: true,
    });
    this.setupConnection(connection);
  }

  public sendCode(code: string, isGlobal: boolean) {
    const payload = JSON.stringify({ content: code, isGlobal });
    for (const [_, conn] of this.conns.entries()) {
      if (conn.open) {
        conn.send(payload);
      }
    }
  }

  public disconnect() {
    this.isResetting = false;
    for (const [id, timeout] of this.connectionTimeouts.entries()) {
      clearTimeout(timeout);
    }
    this.connectionTimeouts.clear();

    for (const [_, conn] of this.conns.entries()) {
      conn.close();
    }
    this.conns.clear();
    
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    
    this.events.onStateChange("disconnected");
  }
}
