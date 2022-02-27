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

	console.info("new client", id);

	ws.send(JSON.stringify(messages));

	ws.on("message", (rawMessage) => {
		try {
			const { name, message } = JSON.parse(rawMessage.toString());

			messages.push({ name, message });

			for (const id in clients) {
				clients[id].send(JSON.stringify([{ name, message }]));
			}
		} catch (e) {
			console.error(e.message);
		}
	});

	ws.on("close", () => {
		delete clients[id];

		console.info("client is closed", id);
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
