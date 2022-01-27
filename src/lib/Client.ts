import {
	Contact,
	DisconnectReason,
	isJidUser,
	jidNormalizedUser,
	WAMessage,
	WAMessageStubType,
} from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";
import { Socket } from "@typings/Baileys";
import {
	ChatJson,
	ChatUpdate,
	StatusMessageUpdate,
	UnreadCountChatUpdate,
} from "@typings/SocketIO";
import { remove } from "fs-extra";
import { isUndefined, omit, omitBy, pick } from "lodash";
import { join } from "path";
import { EventEmitter } from "stream";

import { Chat, Database, Message, Presences, SocketIO } from "@lib";
import { createConnection } from "@utils";

export class Client extends EventEmitter {
	socket?: Socket;
	io: SocketIO;
	db: Database;
	qr?: string;

	private whatsappTimeout: NodeJS.Timeout | undefined;
	private me?: Contact;

	private dataDir: string;
	get authFile(): string {
		return join(this.dataDir, "auth.json");
	}
	private get storeFile(): string {
		return join(this.dataDir, "store.db");
	}

	constructor(dataDir: string) {
		super();
		this.dataDir = dataDir;
		this.io = new SocketIO(this);
		this.db = new Database(this.storeFile);
	}

	async init(): Promise<void> {
		await this.createConnection();
		await this.db.init();

		this.handleWhatsappTimeout();
	}

	private handleWhatsappTimeout(): void {
		const timeoutDuration =
			parseInt(process.env.HIBERNATE ?? "NaN") || 120_000;

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

		this.socket.ev
			.on(
				"connection.update",
				async ({ connection, lastDisconnect, qr }) => {
					if (this.socket?.user?.id && !this.me?.id) {
						this.me = {
							id: jidNormalizedUser(this.socket.user.id),
							name: this.socket.user.name,
						};

						console.log(`Logged in with: ${this.me.name}`);
					}

					if (qr || connection == "open") {
						this.qr = qr;
						this.io.io.emit("qr", qr ?? "");
					}

					const last = lastDisconnect?.error as Boom;

					if (
						last?.data?.reconnect != false &&
						connection == "close"
					) {
						if (
							last?.output?.statusCode ==
							DisconnectReason.loggedOut
						) {
							console.log("Logged Out!");
							await remove(this.authFile);
							return;
						}
						console.log("Reconnecting in 1 second");

						setTimeout(() => this.createConnection(), 1000);
					}
				},
			)
			.on("chats.set", async ({ chats }) => {
				await this.db.batchUpsert("chats", chats.map(Chat));
			})
			.on("chats.upsert", async (chats) => {
				await this.db.batchUpsert("chats", chats.map(Chat));
			})
			.on("messages.set", async ({ messages }) => {
				await this.db.batchUpsert(
					"messages",
					messages.map((msg) => Message(msg, this.me!)),
				);
			})
			.on("contacts.upsert", async (contacts) => {
				await this.db.batchUpsert("contacts", contacts);
			})
			.on("contacts.update", async (contacts) => {
				await this.db.batchUpsert("contacts", contacts);
			})
			.on("messages.upsert", async ({ messages: msgs, type }) => {
				const messages = msgs
					.filter(this.filterMessages, this)
					.map((msg) => Message(msg, this.me!));

				if (!messages.length) {
					return console.log("All messages filtered: ", msgs);
				}

				console.log(`New Messages ${type} : `, msgs, messages);

				if (["append", "notify"].includes(type)) {
					this.emit("message", messages);
				}
				if (["append", "notify", "prepend"].includes(type)) {
					await this.db.batchUpsert("messages", messages);
				}
			})
			.on("messages.update", async (messages) => {
				if (!messages.some((msg) => "status" in msg.update)) {
					console.log(messages);

					console.error(new Error("Other Update than status?"));
				}

				const messagesUpdate = await this.db.createQueryWithCoalesce<
					StatusMessageUpdate[]
				>(
					`${this.db
						.knex("messages")
						.insert(
							messages.map(({ key, update }) =>
								pick(
									Message({ key, ...update }, this.me!),
									"id",
									"status",
								),
							),
						)
						.onConflict("id")
						.merge()
						.toQuery()} returning ??, ??, ??`,
					["id", "chatId", "status"],
				);

				const unreadCountUpdate = await this.db.knex.raw<
					UnreadCountChatUpdate[]
				>(
					`${this.db
						.knex("chats")
						.whereIn(
							"id",
							this.db
								.knex("messages")
								.whereIn(
									"id",
									messages.map((msg) => msg.key.id!),
								)
								.select("chatId"),
						)
						.update({ unreadCount: 0 })
						.toQuery()} returning ??, ??`,
					["id", "unreadCount"],
				);

				this.io.io.emit("message.update", messagesUpdate);
				this.io.io.emit("chats.update", unreadCountUpdate);
			})
			.on("presence.update", async ({ id, presences }) => {
				if (!isJidUser(id)) return;

				await this.db.batchUpsert("contacts", Presences(presences));
				this.io.io.emit("presence", Presences(presences));
			})
			.on("chats.update", async (chatsUpdate) => {
				const chats = chatsUpdate.map((chat) =>
					omitBy(Chat(chat), isUndefined),
				) as ChatJson[];

				const updateVerifiedChats = chats
					.map((chat) => omit(chat, "unreadCount"))
					.filter((chat) =>
						Object.keys(chat).some((key) =>
							["time", "name"].includes(key),
						),
					);

				await this.db.batchUpsert("chats", updateVerifiedChats);
				this.io.io.emit(
					"chats.update",
					updateVerifiedChats as ChatUpdate[],
				);

				const unreadCountEmit = await Promise.all(
					chats
						.filter((chat) => chat.unreadCount != undefined)
						.map(async (chat) => {
							const unreadCount = (
								await this.db.knex.raw<UnreadCountChatUpdate[]>(
									`${this.db
										.knex("chats")
										.where({ id: chat.id })
										.increment(
											"unreadCount",
											chat.unreadCount!,
										)
										.toQuery()} returning ??`,
									"unreadCount",
								)
							)[0].unreadCount;

							return {
								id: chat.id!,
								unreadCount,
							};
						}),
				);

				if (unreadCountEmit.length)
					this.io.io.emit("chats.update", unreadCountEmit);
			});
	}
}
