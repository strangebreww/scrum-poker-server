import { existsSync, readFileSync, writeFile } from "fs";
import { v4 as uuid } from "uuid";
import { WebSocketServer } from "ws";
import { port } from "./config.js";

const clients = {};
const log = existsSync("log") && readFileSync("log");
console.log("log", JSON.parse(log));
// const players = JSON.parse(log) || [];
const players = [];

const wss = new WebSocketServer({ port });

console.log("Server is running on port " + port);

wss.on("connection", (ws) => {
	const id = uuid();
	clients[id] = ws;

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

		console.log("client is closed", id);

		broadcastMessage(clients, "closed client", { id });
	});
});

process.on("SIGINT", () => {
	wss.close();

	writeFile("log", JSON.stringify(players), (err) => {
		if (err) {
			console.error(err);
		}

		process.exit();
	});
});

function broadcastMessage(clients, type, payload) {
	for (const id in clients) {
		clients[id].send(JSON.stringify({ type, payload }));
	}
}
