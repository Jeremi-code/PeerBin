import SimplePeer from "simple-peer";

export type ConnectState = "disconnected" | "connecting" | "connected";

interface PeerEvents {
  onStateChange: (state: ConnectState) => void;
  onCodeReceived: (code: string, isGlobal: boolean) => void;
  onIdGenerated: (id: string) => void;
  onConnectionError: (error: string) => void;
}

export class OnlinePeer {
  private peers: Map<string, SimplePeer.Instance> = new Map();
  private events: PeerEvents;
  private currentId: string | null = null;
  private signalSender?: (targetId: string, signal: any) => void;

  constructor(events: PeerEvents) {
    this.events = events;
  }

  public init(signalSender: (targetId: string, signal: any) => void) {
    this.signalSender = signalSender;
    if (!this.currentId) {
      this.currentId = Math.random().toString(36).substring(2, 7).toUpperCase();
    }
    console.log("🚀 OnlinePeer initialized with ID:", this.currentId);
    this.events.onIdGenerated(this.currentId);
    this.events.onStateChange("disconnected");
  }

  public handleIncomingSignal(senderId: string, signal: any) {
    let peer = this.peers.get(senderId);

    if (!peer) {
      console.log(`📥 Incoming connection request from ${senderId}`);
      peer = this.createPeer(senderId, false);
    }

    peer.signal(signal);
  }

  private createPeer(targetId: string, initiator: boolean): SimplePeer.Instance {
    const peer = new SimplePeer({
      initiator,
      trickle: true,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "turn:global.relay.metered.ca:443",
            username: import.meta.env.VITE_TURN_USERNAME,
            credential: import.meta.env.VITE_TURN_CREDENTIAL
          }
        ]
      }
    });

    peer.on("signal", (data) => {
      this.signalSender?.(targetId, data);
    });

    peer.on("connect", () => {
      console.log(`✅ P2P Connected to ${targetId}`);
      this.events.onStateChange("connected");
    });

    peer.on("data", (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        this.events.onCodeReceived(parsed.content, parsed.isGlobal);
      } catch {
        this.events.onCodeReceived(data.toString(), false);
      }
    });

    peer.on("close", () => {
      console.log(`❌ P2P Connection closed with ${targetId}`);
      this.peers.delete(targetId);
      if (this.peers.size === 0) {
        this.events.onStateChange("disconnected");
      }
    });

    peer.on("error", (err) => {
      console.error(`P2P Error with ${targetId}:`, err);
      this.events.onConnectionError(`P2P Error: ${err.message}`);
      peer.destroy();
    });

    this.peers.set(targetId, peer);
    return peer;
  }

  public connectTo(targetId: string) {
    const tid = targetId.toUpperCase();
    if (this.peers.has(tid)) return;
    
    this.events.onStateChange("connecting");
    this.createPeer(tid, true);
  }

  public sendCode(code: string, isGlobal: boolean) {
    const payload = JSON.stringify({ content: code, isGlobal });
    this.peers.forEach((peer) => {
      if (peer.connected) {
        peer.send(payload);
      }
    });
  }

  public disconnect() {
    this.peers.forEach((peer) => peer.destroy());
    this.peers.clear();
    this.events.onStateChange("disconnected");
  }
}
