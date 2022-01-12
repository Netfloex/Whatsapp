import express from "express";
import { createServer } from "http";
import { join } from "path";
import { Server } from "socket.io";

import { Chat, Client, Message } from "@lib";

console.clear();

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const authFile = join(process.cwd(), "data", "auth.json");

const main = async (): Promise<void> => {
	const client = new Client(authFile);

	io.on("connection", (sock) => {
		console.log(`Connection: ${sock.id.slice(0, 4)}`);
		sock.onAny((ev, data) => {
			console.log(`Socket: ${sock.id.slice(0, 4)}, event: ${ev}`, data);
		});
	});

	client.on("chats", (chats: Chat[]) => {
		console.log("chats", chats.slice(0, 10));
	});

	client.on("message", (messages: Message[]) => {
		console.log("new message");

		io.sockets.emit(
			"message",
			messages.map((msg) => msg.toJSON()),
		);
	});

	app.get("/", (req, res) => {
		res.json(client.chats.slice(0, 30).map((oldChat) => oldChat.toJSON()));
	});

	await client.init();

	server.listen(3000);
};

main().catch((err) => {
	console.error(err);
});
