import { ChatJson, DBContact, MessageJson } from "@typings/SocketIO";

declare module "knex/types/tables" {
	interface Tables {
		chats?: ChatJson;
		messages?: MessageJson;
		contacts?: DBContact;
	}
}
