import { v4 as uuid } from "uuid";
import { WebSocketServer } from "ws";

const clients = {};

const wss = new WebSocketServer({ port: 8000 });

wss.on("connection", (ws) => {
	const id = uuid();
	clients[id] = ws;

	console.log("new client", id);

	ws.on("message", (rawMessage) => {
		console.log("raw message", rawMessage);
	});

	ws.on("close", () => {
		delete clients[id];
		console.log("client is closed", id);
	});
});
