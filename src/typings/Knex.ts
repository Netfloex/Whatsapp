import { ChatJson, MessageJson } from "@typings/SocketIO";

type DBContact = {
	id?: string;
	name?: string;
	notify?: string;
	isMe?: boolean;
};

declare module "knex/types/tables" {
	interface Tables {
		chats?: ChatJson;
		messages?: MessageJson;
		contacts?: DBContact;
	}
}
