import Peer, { type DataConnection } from "peerjs";

export type ConnectState = "disconnected" | "connecting" | "connected";

interface PeerEvents {
  onStateChange: (state: ConnectState) => void;
  onCodeReceived: (code: string, isGlobal: boolean) => void;
  onIdGenerated: (id: string) => void;
}

export class OnlinePeer {
  private peer: Peer | null = null;
  private conns: Map<string, DataConnection> = new Map();
  private events: PeerEvents;

  constructor(events: PeerEvents) {
    this.events = events;
  }

  public init() {
    const randomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.peer = new Peer(randomId);

    this.peer.on("open", (id) => {
      this.events.onIdGenerated(id);
      this.events.onStateChange("disconnected");
    });

    this.peer.on("connection", (connection) => {
      this.setupConnection(connection);
    });

    this.peer.on("error", (err) => {
      console.error("PeerJS error:", err);
    });
  }

  private setupConnection(connection: DataConnection) {
    this.conns.set(connection.peer, connection);
    this.events.onStateChange("connecting");

    connection.on("open", () => {
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
      this.conns.delete(connection.peer);
      if (this.conns.size === 0) {
        this.events.onStateChange("disconnected");
      }
    });

    connection.on("error", (err) => {
      console.error("Connection error", err);
      this.conns.delete(connection.peer);
      if (this.conns.size === 0) {
        this.events.onStateChange("disconnected");
      }
    });
  }

  public connectTo(targetId: string) {
    if (!this.peer) return;
    const connection = this.peer.connect(targetId.toUpperCase());
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
    for (const [_, conn] of this.conns.entries()) {
      conn.close();
    }
    this.conns.clear();
    this.events.onStateChange("disconnected");
  }
}
