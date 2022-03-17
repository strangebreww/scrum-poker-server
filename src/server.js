import { existsSync, readFileSync, writeFile } from "fs";
import { v4 as uuid } from "uuid";
import { WebSocketServer } from "ws";

const clients = {};
const log = existsSync("log") && readFileSync("log");
const messages = JSON.parse(log) || [];

const wss = new WebSocketServer({ port: 8000 });

wss.on("connection", (ws) => {
	const id = uuid();
	clients[id] = ws;

	broadcastMessage(clients, "new client", { id, estimate: null });

	ws.send(JSON.stringify(messages));

	ws.on("message", (rawMessage) => {
		try {
			const { id, estimate } = JSON.parse(rawMessage.toString());

			messages.push({ id, estimate });

			broadcastMessage(clients, "active client", { id, estimate });
		} catch (e) {
			console.error(e.message);
		}
	});

	ws.on("close", () => {
		delete clients[id];

		console.info("client is closed", id);

		broadcastMessage(clients, "closed client", { id });
	});
});

process.on("SIGINT", () => {
	wss.close();

	writeFile("log", JSON.stringify(messages), (err) => {
		if (err) {
			console.error(err);
		}

		process.exit();
	});
});

function broadcastMessage(clients, name, message) {
	for (const id in clients) {
		clients[id].send(JSON.stringify([{ name, message }]));
	}
}
