import { Contact, jidNormalizedUser } from "@adiwajshing/baileys-md";
import { ChatJson, DBContact, MessageJson } from "@typings/SocketIO";
import { Knex, knex } from "knex";
import { chunk } from "lodash";

export class Database {
	knex: Knex;

	constructor(storeFile: string) {
		this.knex = knex({
			client: "better-sqlite3",
			connection: {
				filename: storeFile,
			},

			useNullAsDefault: true,
		});
	}

	private async createTableIfNotExists(
		tableName: string,
		callback: (tableBuilder: Knex.CreateTableBuilder) => void,
	): Promise<void> {
		if (!(await this.knex.schema.hasTable(tableName)))
			await this.knex.schema.createTable(tableName, callback);
	}

	async init(): Promise<void> {
		await this.createTableIfNotExists("chats", (table) => {
			table.string("id").unique();
			table.string("name");
			table.dateTime("time");
			table.integer("unreadCount");
			table.boolean("archive");
			table.boolean("muted");
		});

		await this.createTableIfNotExists("messages", (table) => {
			table.string("id").unique();
			table.dateTime("time");
			table.json("message");
			table.string("senderId");
			table.boolean("fromMe");
			table.string("chatId");
			table.string("content");
		});

		await this.createTableIfNotExists("contacts", (table) => {
			table.string("id").unique();
			table.string("name");
			table.string("notify");
			table.boolean("isMe");
			table.string("presence");
			table.dateTime("presenceUpdated");
		});
	}

	async batchUpsert(tableName: Knex.TableNames, data: any[]): Promise<void> {
		if (!data.length) return;

		const chunked = chunk(data, 500);

		for (const data of chunked) {
			await this.knex.raw(
				this.knex(tableName)
					.insert(data)
					.onConflict("id")
					.merge()
					.toQuery()
					.replace(/excluded\.(`\w+`)/g, "coalesce($&, $1)"),
			);
		}
	}

	async addMe(me: Contact): Promise<void> {
		await this.batchUpsert("contacts", [
			{
				id: jidNormalizedUser(me.id),
				name: me.name,
				notify: me.notify,
				isMe: true,
			},
		]);
	}

	async chats(length = 100): Promise<ChatJson[]> {
		return await this.knex("chats")
			.orderBy("time", "desc")
			.leftOuterJoin("contacts", "contacts.id", "chats.id")
			.limit(length)
			.select(
				"chats.*",
				this.knex.raw("coalesce(??, ??) as name", [
					"contacts.name",
					"chats.name",
				]),
			);
	}

	async messagesFor(chatId: string, length = 100): Promise<MessageJson[]> {
		return await this.knex("messages")
			.where("chatId", chatId)
			.orderBy("time", "desc")
			.limit(length)
			.select(
				"*",
				this.knex.raw("REPLACE(??, ?, ?) as senderId", [
					"senderId",
					"me",
					(
						await this.knex("contacts")
							.where({ isMe: 1 })
							.first()
							.select()
					).id,
				]),
			);
	}

	async getContact(id: string): Promise<DBContact> {
		return await this.knex("contacts").where({ id }).first().select();
	}
}
