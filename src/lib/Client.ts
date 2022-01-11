import { DisconnectReason } from "@adiwajshing/baileys-md/src";
import { Boom } from "@hapi/boom";
import { ChatSet, Socket } from "@typings/Baileys";
import { pathExists, readJSON, remove, writeJSON } from "fs-extra";
import { join } from "path";
import { EventEmitter } from "stream";

import { Chat } from "@lib";
import { createConnection } from "@utils";

export class Client extends EventEmitter {
	socket: Socket;

	private authFile: string;
	private chatSetFile: string;

	private data: ChatSet = {
		chats: [],
		contacts: [],
		messages: [],
	};

	chats: Chat[] = [];

	private joinData = (...paths: string[]): string =>
		join(process.cwd(), "data", ...paths);

	constructor(authFile: string) {
		super();
		this.authFile = authFile;
		this.chatSetFile = this.joinData("chatset.json");

		this.on("data", async (write = true) => {
			if (write) {
				await writeJSON(this.chatSetFile, this.data, {
					spaces: "\t",
				});
			}

			if (this.data.contacts.length && this.data.chats.length) {
				this.chats = this.data.chats
					.map(
						(chat) =>
							new Chat(
								chat,
								this.data.contacts,
								this.data.messages,
							),
					)
					.sort((a, b) => b.time.toMillis() - a.time.toMillis());
			}
		});
	}

	async init(): Promise<void> {
		if (await pathExists(this.chatSetFile)) {
			this.data = await readJSON(this.chatSetFile);
			this.emit("data", false);
		}

		this.createConnection();
	}

	private async createConnection(): Promise<void> {
		console.log("creating Socket");

		if (this.socket) {
			console.log("Ending old Socket");

			this.socket.end(undefined);
		}
		this.socket = await createConnection(this.authFile);

		this.socket.ev
			.on("connection.update", async ({ connection, lastDisconnect }) => {
				if (connection == "close") {
					if (
						(lastDisconnect.error as Boom)?.output?.statusCode ==
						DisconnectReason.loggedOut
					) {
						console.log("Logged Out!");
						await remove(this.authFile);
					}
					console.log("Reconnecting in 1 second");

					setTimeout(() => this.createConnection(), 1000);
				}
			})
			.on("chats.set", async ({ chats, messages }: ChatSet) => {
				console.log("Updating Message Data!");

				this.data.chats = chats;
				this.data.messages = messages;
				this.emit("data");
			})
			.on("contacts.upsert", (contacts) => {
				console.log("Updated Contacts");
				console.log("Contacts", contacts);
				this.data.contacts = contacts;
				this.emit("data");
			})
			.on("messages.upsert", (newM) => {
				console.log("messages.upsert", newM);
				if (["append", "notify"].includes(newM.type)) {
					console.log("Added ^ msg to db");
					this.data.messages.unshift(...newM.messages);
					this.emit("data");
				}
			});
	}
}
