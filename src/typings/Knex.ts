import { ChatJson, DBContact, MessageJson } from "@typings/SocketIO";

// import { Knex as KnexOriginal } from "knex";

declare module "knex/types/tables" {
	interface Tables {
		chats: ChatJson;
		messages: MessageJson;
		contacts: DBContact;
	}
}

// declare module "knex" {
// 	namespace Knex {
// 		interface QueryBuilder {
// 			batchUpsert<TRecord, TResult>(
// 				value: number,
// 			): KnexOriginal.QueryBuilder<TRecord, TResult>;
// 		}
// 	}
// }
