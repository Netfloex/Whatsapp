import type {
	AnyMessageContent,
	WAMessageContent,
} from "@adiwajshing/baileys-md";

export type Person = {
	id?: string | null;
	pushname?: string | null;
	contactName?: string;
};

export type MessageJson = {
	id?: string;
	time: string;
	message?: WAMessageContent;
	sender?: Person;
	fromMe?: boolean;
	chatId?: string;

	content?: string;
};

export type ChatJson = {
	id: string;
	name: string;
	time: string;
	messages: MessageJson[];
	unreadCount?: number;
};

export interface ServerToClient {
	message: (data: MessageJson[]) => void;
}

export interface ClientToServer {
	chats: (reply: (chats: ChatJson[]) => void) => void;

	"message.send": (
		message: AnyMessageContent & {
			jid: string;
		},
	) => PromiseLike<void>;
}
