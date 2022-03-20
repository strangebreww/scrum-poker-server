import { v4 as uuid } from "uuid";
import { WebSocketServer } from "ws";
import { port } from "./config.js";

const clients = {};
let players = [];

const wss = new WebSocketServer({ port });

console.log("Server is running on port " + port);

wss.on("connection", (ws) => {
	const id = uuid();
	clients[id] = ws;
	players.push({ id, estimate: null });

	console.log("new client", id);

	broadcastMessage(clients, "new client", { id, estimate: null });

	ws.send(JSON.stringify(players));

	ws.on("message", (rawMessage) => {
		try {
			const { id, estimate } = JSON.parse(rawMessage.toString());

			players.push({ id, estimate });

			broadcastMessage(clients, "active client", { id, estimate });
		} catch (e) {
			console.error(e.message);
		}
	});

	ws.on("close", () => {
		delete clients[id];
		players = players.filter((p) => p.id !== id);

		console.log("client is closed", id);

		broadcastMessage(clients, "closed client", { id });
	});
});

function broadcastMessage(clients, type, payload) {
	for (const id in clients) {
		clients[id].send(JSON.stringify({ type, payload }));
	}
}
