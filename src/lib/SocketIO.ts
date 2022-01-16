import { ClientToServer, ServerToClient } from "@typings/SocketIO";
import express, { Application } from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { Client, Message } from "@lib";

export class SocketIO {
	io: Server<ClientToServer, ServerToClient>;
	app: Application;

	private client: Client;

	constructor(client: Client) {
		this.client = client;
		this.app = express();
		const server = createServer(this.app);
		this.io = new Server(server, { cors: { origin: "*" } });

		this.handleAuthentication();

		this.app.get("/", (req, res) => {
			res.json(this.client.chats.slice(0, 10));
		});

		this.client.on("message", (messages: Message[]) => {
			this.io.sockets.emit(
				"message",
				messages.map((msg) => msg.toJSON()),
			);
		});
		this.io.on("connection", (sock) => {
			sock.on("disconnect", () => {
				console.log(
					`Disconnected: ${sock.id.slice(0, 4)}, Clients: ${
						this.io.of("/").sockets.size
					}`,
				);
			});

			console.log(
				`Connection: ${sock.id.slice(0, 4)}, Clients: ${
					this.io.engine.clientsCount
				}`,
			);
			sock.onAny((ev, data) => {
				console.log(
					`Socket: ${sock.id.slice(0, 4)}, event: ${ev}`,
					data,
				);
			});

			sock.on("chats", (reply) => {
				reply(this.client.chats.slice(0, 40));
			});

			sock.on("message.send", async ({ jid, ...content }, reply) => {
				console.log(`Send a message to ${jid}`);

				await this.client.socket?.sendMessage(jid, content);

				reply("Done");
			});
		});
		server.listen(3000);
	}

	private handleAuthentication(): void {
		this.io.use((socket, next) => {
			const id = socket.id.slice(0, 4);
			console.log(`${id} disconnected, no token`);

			const token = socket.handshake.auth.token as unknown;

			if (!token) {
				console.log(`${id} disconnected, no token`);

				return next(new Error("No token provided"));
			}

			if (process.env.TOKEN != token) {
				console.log(`${id} disconnected, wrong token`);

				return next(new Error("Invalid Token"));
			}
			console.log(`${id} Connected, token is correct`);

			next();
		});
	}
}
