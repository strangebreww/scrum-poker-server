import { v4 as uuid } from "uuid";
import { WebSocketServer } from "ws";

const clients = {};
const messages = [];

const wss = new WebSocketServer({ port: 8000 });

wss.on("connection", (ws) => {
	const id = uuid();
	clients[id] = ws;

	console.log("new client", id);

	ws.send(JSON.stringify(messages));

	ws.on("message", (rawMessage) => {
		console.log("raw message", JSON.parse(rawMessage.toString()));
		try {
			const { name, message } = JSON.parse(rawMessage.toString());
			console.log("received", name, message);

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
		console.log("client is closed", id);
	});
});
