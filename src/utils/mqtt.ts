import mqtt from "mqtt";

export class GlobalRelay {
  private client: mqtt.MqttClient | null = null;
  private onMessage: (code: string) => void;
  private onSignal?: (senderId: string, signalData: any) => void;
  private clientId: string = "";
  private brokers: string[] = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8000/mqtt",
    "wss://test.mosquitto.org:8081/mqtt",
  ];
  private currentBrokerIndex: number = 0;

  constructor(onMessage: (code: string) => void, onSignal?: (senderId: string, signalData: any) => void) {
    this.onMessage = onMessage;
    this.onSignal = onSignal;
  }

  public init(id: string) {
    this.clientId = id.toUpperCase();
    this.connect();
  }

  private connect() {
    const brokerUrl = this.brokers[this.currentBrokerIndex];
    if (!brokerUrl) return;

    console.log(`📡 Connecting to Global Relay via ${brokerUrl}...`);

    this.client = mqtt.connect(brokerUrl, {
      clientId: "peerbin_" + this.clientId + "_" + Math.random().toString(36).substring(7),
      connectTimeout: 5000,
      reconnectPeriod: 2000,
      clean: true,
    });

    this.client.on("connect", () => {
      console.log(`✅ Connected to Global Relay (${brokerUrl})`);
      // Global broadcast channel
      this.client?.subscribe("peerbin/global/messages/v1");
      // Private signaling channel for this specific peer
      this.client?.subscribe(`peerbin/signal/v1/${this.clientId}`);
    });

    this.client.on("message", (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        
        // Handle global broadcasts
        if (topic === "peerbin/global/messages/v1") {
          if (payload.sender !== this.clientId) {
            this.onMessage(payload.content);
          }
        } 
        // Handle incoming P2P signals
        else if (topic === `peerbin/signal/v1/${this.clientId}`) {
          if (this.onSignal && payload.sender !== this.clientId) {
            this.onSignal(payload.sender, payload.signal);
          }
        }
      } catch {
        // ignore malformed payloads
      }
    });

    this.client.on("error", (err: any) => {
      console.error(`❌ MQTT error on ${brokerUrl}:`, err.message || err);
    });

    this.client.on("close", () => {
      if (!this.client?.connected) {
        this.tryNextBroker();
      }
    });
  }

  private tryNextBroker() {
    this.client?.end();
    this.currentBrokerIndex = (this.currentBrokerIndex + 1) % this.brokers.length;
    setTimeout(() => {
      this.connect();
    }, 3000);
  }

  public broadcast(code: string) {
    if (this.client?.connected) {
      const payload = JSON.stringify({ sender: this.clientId, content: code });
      this.client.publish("peerbin/global/messages/v1", payload);
    } else {
      console.warn("Cannot broadcast, MQTT client is disconnected");
    }
  }

  public sendSignal(targetId: string, signalData: any) {
    if (this.client?.connected) {
      const payload = JSON.stringify({ sender: this.clientId, signal: signalData });
      this.client.publish(`peerbin/signal/v1/${targetId.toUpperCase()}`, payload);
    }
  }

  public disconnect() {
    this.client?.end();
  }
}
