import { Contact } from "@adiwajshing/baileys-md";
import { ChatJson, MessageJson } from "@typings/SocketIO";

export type Me = {
	id?: string;
	name?: string;
};

declare module "knex/types/tables" {
	interface Tables {
		chats?: ChatJson;
		messages?: MessageJson;
		contacts?: Contact;
		me?: Me;
	}
}
