import {
	DisconnectReason,
	jidNormalizedUser,
	WAMessage,
	WAMessageStubType,
} from "@adiwajshing/baileys-md";
import { Boom } from "@hapi/boom";
import { Socket } from "@typings/Baileys";
import { ChatJson } from "@typings/SocketIO";
import { Stored } from "@typings/Stored";
import { remove } from "fs-extra";
import { join } from "path";
import { EventEmitter } from "stream";

import { Chat, Message, SocketIO, Store } from "@lib";
import { createConnection } from "@utils";

const joinData = (...paths: string[]): string =>
	join(process.cwd(), "data", ...paths);

export class Client extends EventEmitter {
	socket?: Socket;
	io: SocketIO;
	store = new Store<Stored>(joinData("store.json"), {});
	whatsappTimeout: NodeJS.Timeout | undefined;

	get chats(): ChatJson[] {
		return (
			this.store.data.chats
				?.map((chat) => new Chat(chat, this))
				.sort((a, b) => b.time.toMillis() - a.time.toMillis())
				.slice(0, 100)
				.map((chat) => chat.toJSON()) ?? []
		);
	}

	authFile: string;

	constructor(authFile: string) {
		super();
		this.authFile = authFile;
		this.io = new SocketIO(this);
	}

	async init(): Promise<void> {
		await this.store.init();
		await this.createConnection();

		this.handleWhatsappTimeout();
	}

	private handleWhatsappTimeout(): void {
		const timeoutDuration =
			parseInt(process.env.HIBERNATE ?? "NaN") || 60_000;

		this.whatsappTimeout = setTimeout(() => {
			if (!this.io.size) {
				console.log("No active connections, stopping socket");

				this.socket?.end(
					new Boom("Timeout", { data: { reconnect: false } }),
				);
				delete this.socket;
			}
		}, timeoutDuration);

		this.on("connections.size", async (size) => {
			if (size == 0) {
				this.whatsappTimeout?.refresh();
			} else {
				if (!this.socket) {
					console.log("Connection activated, opening socket");

					await this.createConnection();
				}
			}
		});
	}

	filterMessages(msg: WAMessage): boolean {
		if (msg.message?.protocolMessage) return false;

		if (
			[
				WAMessageStubType.REVOKE,
				WAMessageStubType.E2E_DEVICE_CHANGED,
				WAMessageStubType.E2E_IDENTITY_CHANGED,
				WAMessageStubType.CIPHERTEXT,
			].includes(msg.messageStubType as WAMessageStubType)
		)
			return false;

		if (
			this.store.data.messages?.find(
				(message) => message.key.id == msg.key.id,
			)
		)
			return false;

		return true;
	}

	private async createConnection(): Promise<void> {
		console.log("Creating Socket");

		if (this.socket) {
			console.log("Ending old Socket");

			this.socket.end(
				new Boom("Reconnecting", { data: { reconnect: false } }),
			);
		}

		this.socket = await createConnection(this);

		if (this.socket?.user?.name) {
			this.store.data.me = {
				id:
					this.socket?.user?.id &&
					jidNormalizedUser(this.socket.user.id),
				name: this.socket?.user?.name,
			};
			await this.store.write();

			console.log(`Logged in with: ${this.store.data.me.name}`);
		}

		this.socket.ev
			.on("connection.update", async ({ connection, lastDisconnect }) => {
				const last = lastDisconnect?.error as Boom;

				if (last?.data?.reconnect != false && connection == "close") {
					if (
						last?.output?.statusCode == DisconnectReason.loggedOut
					) {
						console.log("Logged Out!");
						await remove(this.authFile);
					}
					console.log("Reconnecting in 1 second");

					setTimeout(() => this.createConnection(), 1000);
				}
			})
			.on("chats.set", async ({ chats, messages }) => {
				this.store.data.messages = messages.filter(
					this.filterMessages,
					this,
				);
				this.store.data.chats = chats;
				await this.store.write();
			})
			.on("contacts.upsert", async (contacts) => {
				this.store.data.contacts = contacts;
				await this.store.write();
			})
			.on("messages.upsert", async ({ messages: msgs, type }) => {
				const messages = msgs
					.filter(this.filterMessages, this)
					.map((m) => new Message(m, this));
				console.log(`New Messages ${type} : `, messages);

				if (!messages.length) {
					return console.log("All messages filtered: ", msgs);
				}

				if (["append", "notify"].includes(type)) {
					this.emit("message", messages);
				}
				if (["append", "notify", "prepend"].includes(type)) {
					this.store.data.messages?.unshift(
						...msgs.filter(this.filterMessages, this),
					);

					await this.store.write();
				}
			})
			.on("presence.update", (presence) => {
				this.io.io.emit("presence", presence);
			})
			.on("chats.update", (chats) => {
				this.io.io.emit("chats.update", chats);
			});
	}
}
