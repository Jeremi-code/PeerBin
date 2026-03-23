import mqtt from "mqtt";

export class GlobalRelay {
  private client: mqtt.MqttClient | null = null;
  private onMessage: (code: string) => void;
  // Use a unique client ID so we don't bounce our own sent messages back to our inbox
  private clientId: string = Math.random().toString(36).substring(2, 10);
  private brokers: string[] = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8000/mqtt",
    "wss://test.mosquitto.org:8081/mqtt",
  ];
  private currentBrokerIndex: number = 0;

  constructor(onMessage: (code: string) => void) {
    this.onMessage = onMessage;
  }

  public init() {
    this.connect();
  }

  private connect() {
    const brokerUrl = this.brokers[this.currentBrokerIndex];
    if (!brokerUrl) return;

    console.log(`📡 Connecting to Global Relay via ${brokerUrl}...`);

    this.client = mqtt.connect(brokerUrl, {
      clientId: "peerbin_" + this.clientId,
      connectTimeout: 5000,
      reconnectPeriod: 2000,
    });

    this.client.on("connect", () => {
      console.log(`✅ Connected to Global Relay (${brokerUrl})`);
      this.client?.subscribe("peerbin/global/messages/v1");
    });

    this.client.on("message", (topic, message) => {
      if (topic === "peerbin/global/messages/v1") {
        try {
          const payload = JSON.parse(message.toString());
          if (payload.sender !== this.clientId) {
            this.onMessage(payload.content);
          }
        } catch {
          // ignore malformed payloads
        }
      }
    });

    this.client.on("error", (err: any) => {
      console.error(`❌ MQTT error on ${brokerUrl}:`, err.message || err);
    });

    this.client.on("close", () => {
      // If we haven't connected yet and we have more brokers to try, rotate!
      if (!this.client?.connected) {
        this.tryNextBroker();
      }
    });
  }

  private tryNextBroker() {
    this.client?.end();
    this.currentBrokerIndex = (this.currentBrokerIndex + 1) % this.brokers.length;
    
    // Only try to reconnect if we haven't exhausted all options in this cycle
    // or use a delay to avoid hammering
    setTimeout(() => {
      this.connect();
    }, 3000);
  }

  public broadcast(code: string) {
    if (this.client && this.client.connected) {
      const payload = JSON.stringify({ sender: this.clientId, content: code });
      this.client.publish("peerbin/global/messages/v1", payload);
    } else {
      console.warn("Cannot broadcast, MQTT client is disconnected");
    }
  }

  public disconnect() {
    this.client?.end();
  }
}
