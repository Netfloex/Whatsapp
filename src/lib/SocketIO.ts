import { ClientToServer, MessageJson, ServerToClient } from "@typings/SocketIO";
import express, { Application } from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { Client } from "@lib";

export class SocketIO {
	io: Server<ClientToServer, ServerToClient>;
	app: Application;

	get size(): number {
		return this.io.of("/").sockets.size;
	}

	private client: Client;

	constructor(client: Client) {
		this.client = client;
		this.app = express();
		const server = createServer(this.app);
		this.io = new Server(server, { cors: { origin: "*" } });

		this.handleAuthentication();

		this.client.on("message", (messages: MessageJson[]) => {
			this.io.sockets.emit("message", messages);
		});

		this.io.on("connection", (sock) => {
			this.onConnectionChange();
			console.log(
				`Connection: ${sock.id.slice(0, 4)}, Clients: ${this.size}`,
			);

			sock.on("disconnect", () => {
				this.onConnectionChange();
				console.log(
					`Disconnected: ${sock.id.slice(0, 4)}, Clients: ${
						this.size
					}`,
				);
			})

				.onAny((ev, data) => {
					console.log(
						`Socket: ${sock.id.slice(0, 4)}, event: ${ev}`,
						data,
					);
				})

				.on("chats", async (reply) => {
					reply(await this.client.db.chats(40));
				})

				.on("messages.for", async ({ chatId, length }, reply) => {
					console.log(
						await this.client.db.messagesFor(chatId, length),
					);

					reply(await this.client.db.messagesFor(chatId, length));
				})

				.on("contact", async (chatId, reply) => {
					reply(await this.client.db.getContact(chatId));
				})

				.on("message.send", async ({ jid, ...content }) => {
					console.log(`Send a message to ${jid}`);

					await this.client.socket?.sendMessage(jid, content);
				})

				.on("messages.search", async (condition, reply) => {
					reply(await this.client.db.searchMessage(condition));
				})

				.on("message.suggest", async (content, reply) => {
					reply((await this.client.db.suggestMessage(content)) ?? {});
				})

				.on("presence.subscribe", async (id, reply) => {
					await this.client.socket?.presenceSubscribe(id);

					reply(await this.client.db.getContact(id));
				});
		});

		server.listen(3000);
	}

	private onConnectionChange(): void {
		this.client.emit("connections.size", this.size);
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
