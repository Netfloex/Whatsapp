import { Knex, knex } from "knex";
import { chunk } from "lodash";

export class Database {
	knex: Knex;

	constructor(storeFile: string) {
		this.knex = knex({
			client: "sqlite3",
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
			table.boolean("isGroup");
		});

		await this.createTableIfNotExists("messages", (table) => {
			table.string("id").unique();
			table.dateTime("time");
			table.json("message");
			table.json("sender");
			table.boolean("fromMe");
			table.string("chatId");
			table.string("content");
		});

		await this.createTableIfNotExists("contacts", (table) => {
			table.string("id").unique();
			table.string("name");
			table.string("notify");
		});
	}

	async batchInsert<T extends Array<unknown>>(
		builder: Knex.QueryBuilder,
		data: T,
	): Promise<void> {
		const chunked = chunk(data, 500);

		for (const data of chunked) {
			await builder.insert(data).onConflict("id").merge();
		}
	}
}
