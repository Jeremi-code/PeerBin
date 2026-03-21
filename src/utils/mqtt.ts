import mqtt from "mqtt";

export class GlobalRelay {
  private client: mqtt.MqttClient | null = null;
  private onMessage: (code: string) => void;
  // Use a unique client ID so we don't bounce our own sent messages back to our inbox
  private clientId: string = Math.random().toString(36).substring(2, 10);

  constructor(onMessage: (code: string) => void) {
    this.onMessage = onMessage;
  }

  public init() {
    // Connect to the free public MQTT broker over secure WebSockets
    this.client = mqtt.connect("wss://test.mosquitto.org:8081/mqtt", {
      clientId: "peerbin_" + this.clientId,
    });

    this.client.on("connect", () => {
      console.log("Connected to Global Relay");
      this.client?.subscribe("peerbin/global/messages/v1");
    });

    this.client.on("message", (topic, message) => {
      if (topic === "peerbin/global/messages/v1") {
        try {
          const payload = JSON.parse(message.toString());
          // If the message is from someone else, trigger the callback!
          if (payload.sender !== this.clientId) {
            this.onMessage(payload.content);
          }
        } catch {
          // ignore malformed payloads
        }
      }
    });

    this.client.on("error", (err) => {
      console.error("MQTT error", err);
    });
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
