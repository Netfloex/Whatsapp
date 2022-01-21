import type { AnyMessageContent, Chat } from "@adiwajshing/baileys-md";

export type DBContact = {
	id?: string;
	name?: string;
	notify?: string;
	isMe?: 0 | 1;
	presence?: string;
	presenceUpdated?: string;
};

export type MessageJson = {
	id: string;
	time?: string;
	message?: string;
	senderId?: string;
	fromMe?: boolean;
	chatId?: string;

	content?: string;
};

export type ChatJson = {
	id: string;
	name?: string;
	time?: string;
	unreadCount?: number;
};

export interface ServerToClient {
	message: (messages: MessageJson[]) => void;
	presence: (presences: DBContact[]) => void;
	"chats.update": (chats: Partial<Chat>[]) => void;
}

export interface ClientToServer {
	chats: (reply: (chats: ChatJson[]) => void) => void;

	"messages.for": (
		data: {
			chatId: string;
			length?: number;
		},
		reply: (messages: MessageJson[]) => void,
	) => void;

	contact: (chatId: string, reply: (contact: DBContact) => void) => void;

	"message.send": (
		message: AnyMessageContent & {
			jid: string;
		},
	) => void;

	"presence.subscribe": (
		jid: string,
		reply: (data: DBContact) => void,
	) => void;
}
