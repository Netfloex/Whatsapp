import type {
	AnyMessageContent,
	Chat,
	WAMessageStatus,
} from "@adiwajshing/baileys";

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
	fromMe?: 0 | 1;
	chatId?: string;
	status?: WAMessageStatus;
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
	"chats.unreadCount": (
		chats: Required<Pick<ChatJson, "id" | "unreadCount">>[],
	) => void;
	qr: (qr: string) => void;
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

	contact: (
		chatId: string,
		reply: (contact: DBContact | undefined) => void,
	) => void;

	"message.send": (
		message: AnyMessageContent & {
			jid: string;
		},
	) => void;

	"presence.subscribe": (
		jid: string,
		reply: (data: DBContact | undefined) => void,
	) => void;

	// "messages.search": (
	// 	where: {
	// 		content: string;
	// 		where?: Partial<MessageJson>;
	// 	},
	// 	reply: (messages: MessageJson[]) => void,
	// ) => void;

	"message.suggest": (
		content: string,
		reply: (message: Partial<MessageJson>) => void,
	) => void;
}
