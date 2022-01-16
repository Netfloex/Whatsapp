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

	get chats(): ChatJson[] {
		return (
			this.store.data.chats
				?.map((chat) => new Chat(chat, this))
				.sort((a, b) => b.time.toMillis() - a.time.toMillis())
				.map((chat) => chat.toJSON()) ?? []
		);
	}

	private authFile: string;

	constructor(authFile: string) {
		super();
		this.authFile = authFile;
		this.io = new SocketIO(this);
	}

	async init(): Promise<void> {
		await this.store.init();
		await this.createConnection();
	}

	filterMessages(msg: WAMessage): boolean {
		if (msg.message?.protocolMessage) return false;

		if (
			[
				WAMessageStubType.REVOKE,
				WAMessageStubType.E2E_DEVICE_CHANGED,
				WAMessageStubType.E2E_IDENTITY_CHANGED,
			].includes(msg.messageStubType as WAMessageStubType)
		)
			return false;
		return true;
	}

	private async createConnection(): Promise<void> {
		console.log("Creating Socket");

		if (this.socket) {
			console.log("Ending old Socket");

			this.socket.end(new Error("Reconnecting"));
		}

		this.socket = await createConnection(this.authFile);

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
				if (connection == "close") {
					if (
						(lastDisconnect?.error as Boom)?.output?.statusCode ==
						DisconnectReason.loggedOut
					) {
						console.log("Logged Out!");
						await remove(this.authFile);
					}
					console.log("Reconnecting in 1 second");

					setTimeout(() => this.createConnection(), 1000);
				}
			})
			.on("chats.set", async ({ chats, messages }) => {
				this.store.data.messages = messages.filter(this.filterMessages);
				this.store.data.chats = chats;
				await this.store.write();
			})
			.on("contacts.upsert", async (contacts) => {
				this.store.data.contacts = contacts;
				await this.store.write();
			})
			.on("messages.upsert", async (newM) => {
				if (["append", "notify"].includes(newM.type)) {
					this.store.data.messages?.unshift(
						...newM.messages.filter(this.filterMessages),
					);

					await this.store.write();
				}
				if (newM.type == "notify") {
					this.emit(
						"message",
						newM.messages.map((m) => new Message(m, this)),
					);
				}
			});
	}
}
