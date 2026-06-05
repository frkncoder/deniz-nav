import WebSocket from 'ws';

const API_KEY = "1ba4f6d30362f9a0b0959403f9ca8dd3e37b4c9c";
const BOUNDING_BOX = [[[35.8, 25.6], [42.2, 44.8]]];

const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

ws.on('open', () => {
    console.log("Connected to AISStream");
    const subscriptionMessage = {
        APIKey: API_KEY,
        BoundingBoxes: BOUNDING_BOX,
        FilterMessageTypes: ["PositionReport"]
    };
    ws.send(JSON.stringify(subscriptionMessage));
    console.log("Subscription sent.");
});

ws.on('message', (data) => {
    const aisMessage = JSON.parse(data);
    console.log("Received AIS message:", aisMessage.MetaData?.ShipName, aisMessage.Message?.PositionReport?.UserID);
    process.exit(0); // Exit after receiving one message successfully
});

ws.on('error', (err) => {
    console.error("WS Error:", err);
    process.exit(1);
});

setTimeout(() => {
    console.log("Timeout waiting for message");
    process.exit(1);
}, 10000);
