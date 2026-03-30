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

  constructor(events: PeerEvents) {
    this.events = events;
  }

  public init() {
    const randomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.peer = new Peer(randomId, {
      config: {
        iceServers: [
          // STUN servers — high reliability for direct/NAT traversal
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          { urls: "stun:stun.cloudflare.com:3478" },
          { urls: "stun:stun.stunprotocol.org:3478" },
          { urls: "stun:stun.framasoft.org:3478" },
          // TURN relay servers (User's private Metered.ca credentials for strict NAT bypass)
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
      this.events.onIdGenerated(id);
      this.events.onStateChange("disconnected");
    });

    this.peer.on("disconnected", () => {
      console.warn("🟡 PeerJS disconnected from signaling server. Attempting to reconnect...");
      this.peer?.reconnect();
    });

    this.peer.on("connection", (connection) => {
      this.setupConnection(connection);
    });

    this.peer.on("error", (err) => {
      console.error("❌ PeerJS error:", err.type, err);
      if (err.type === "unavailable-id") {
        console.warn("⚠️ This Peer ID is already taken. Generating a new one...");
        this.init();
      } else if (err.type === "network" || err.type === "server-error") {
        console.error("📡 Signaling error: Attempting full reset in 5 seconds...");
        setTimeout(() => this.init(), 5000);
      } else if (err.type === "peer-unavailable") {
        console.error("🚫 Target peer is not online or ID is incorrect.");
      }
    });
  }

  private setupConnection(connection: DataConnection) {
    this.conns.set(connection.peer, connection);
    this.events.onStateChange("connecting");

    // Set a 12-second timeout to prevent hanging connections
    const timeoutId = setTimeout(() => {
      console.warn(`Connection to ${connection.peer} timed out.`);
      this.events.onConnectionError(
        `Failed to connect to ${connection.peer}. Your networks might be shielded by strict firewalls without an available relay.`
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
          // Fallback for legacy raw text
          this.events.onCodeReceived(data, false);
        }
      }
    });

    connection.on("close", () => {
      clearTimeout(this.connectionTimeouts.get(connection.peer));
      this.connectionTimeouts.delete(connection.peer);
      this.conns.delete(connection.peer);
      if (this.conns.size === 0) {
        this.events.onStateChange("disconnected");
      }
    });

    connection.on("error", (err) => {
      console.error("Connection error", err);
      clearTimeout(this.connectionTimeouts.get(connection.peer));
      this.connectionTimeouts.delete(connection.peer);
      this.events.onConnectionError("Connection lost or failed to establish.");
      this.conns.delete(connection.peer);
      if (this.conns.size === 0) {
        this.events.onStateChange("disconnected");
      }
    });
  }

  public connectTo(targetId: string) {
    if (!this.peer) return;
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
    for (const [id, timeout] of this.connectionTimeouts.entries()) {
      clearTimeout(timeout);
    }
    this.connectionTimeouts.clear();

    for (const [_, conn] of this.conns.entries()) {
      conn.close();
    }
    this.conns.clear();
    this.events.onStateChange("disconnected");
  }
}
