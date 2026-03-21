import Peer, { type DataConnection } from "peerjs";

export type ConnectState = "disconnected" | "connecting" | "connected";

interface PeerEvents {
  onStateChange: (state: ConnectState) => void;
  onCodeReceived: (code: string) => void;
  onIdGenerated: (id: string) => void;
}

export class OnlinePeer {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private events: PeerEvents;

  constructor(events: PeerEvents) {
    this.events = events;
  }

  /**
   * Initialize the PeerJS client to connect to the public cloud signaling server.
   */
  public init() {
    // Generate a simple, readable 5-character ID
    const randomId = Math.random().toString(36).substring(2, 7).toUpperCase();

    // We use the default PeerJS cloud server for signaling over the internet
    this.peer = new Peer(randomId);

    this.peer.on("open", (id) => {
      this.events.onIdGenerated(id);
      this.events.onStateChange("disconnected");
    });

    this.peer.on("connection", (connection) => {
      // Someone connected to us
      this.setupConnection(connection);
    });

    this.peer.on("error", (err) => {
      console.error("PeerJS error:", err);
      this.events.onStateChange("disconnected");
      if (this.conn) this.conn.close();
    });
  }

  private setupConnection(connection: DataConnection) {
    this.conn = connection;
    this.events.onStateChange("connecting");

    this.conn.on("open", () => {
      this.events.onStateChange("connected");
    });

    this.conn.on("data", (data) => {
      if (typeof data === "string") {
        this.events.onCodeReceived(data);
      }
    });

    this.conn.on("close", () => {
      this.events.onStateChange("disconnected");
      this.conn = null;
    });

    this.conn.on("error", (err) => {
      console.error("Connection error", err);
      this.events.onStateChange("disconnected");
      this.conn = null;
    });
  }

  /**
   * Connect to another PeerJS client using their ID.
   */
  public connectTo(targetId: string) {
    if (!this.peer) return;
    const connection = this.peer.connect(targetId.toUpperCase());
    this.setupConnection(connection);
  }

  /**
   * Send code updates directly across the internet.
   */
  public sendCode(code: string) {
    if (this.conn && this.conn.open) {
      this.conn.send(code);
    }
  }

  /**
   * Disconnect the current data connection but keep the peer open for new ones.
   */
  public disconnect() {
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
    this.events.onStateChange("disconnected");
  }
}
