import { AnyMessageContent, WAMessageContent } from "@adiwajshing/baileys-md";

export type MessageJson = {
	time?: string;
	message?: WAMessageContent;
	sender?: string;
	fromMe?: boolean;
	chatJid?: string;

	content?: string;
};

export type ChatJson = {
	name: string;
	time: string;
	messages: MessageJson[];
	unreadCount?: number;
};

export interface ServerToClient {
	message: (data: MessageJson[]) => void;
}

export interface ClientToServer {
	messages: (reply: (chats: ChatJson[]) => void) => void;

	"message.send": (
		message: AnyMessageContent & {
			jid: string;
		},
		reply: (status: string) => void,
	) => PromiseLike<void>;
}
