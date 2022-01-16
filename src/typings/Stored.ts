import { Chat, Contact, WAMessage } from "@adiwajshing/baileys-md";

export type Me = {
	id?: string;
	name?: string;
};

export type Stored = {
	chats?: Chat[];
	messages?: WAMessage[];
	contacts?: Contact[];
	me?: Me;
};
