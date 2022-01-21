import { Contact, jidNormalizedUser } from "@adiwajshing/baileys-md";
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
}
