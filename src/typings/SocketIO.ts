import type { AnyMessageContent, WAMessageStatus } from "@adiwajshing/baileys";

/* 
	Interfaces
*/
export interface DBContact {
	id?: string;
	name?: string;
	notify?: string;
	isMe?: 0 | 1;
	presence?: string;
	presenceUpdated?: string;
}

export interface MessageJson {
	id: string;
	time?: string;
	message?: string;
	senderId?: string;
	fromMe?: 0 | 1;
	chatId?: string;
	status?: WAMessageStatus;
	content?: string;
}

export interface ChatJson {
	id: string;
	name?: string;
	time?: string;
	unreadCount?: number;
}

/* 
	Message Updates
*/

type CreateMessageUpdateType<T extends keyof MessageJson> = Required<
	Pick<MessageJson, "id" | T>
>;

export type StatusMessageUpdate = CreateMessageUpdateType<"status" | "chatId">;

type MessageUpdate = StatusMessageUpdate;

/* 
	Chat Updates
*/

type CreateChatUpdateType<T extends keyof ChatJson> = Required<
	Pick<ChatJson, "id" | T>
>;

export type UnreadCountChatUpdate = CreateChatUpdateType<"unreadCount">;
type TimeChatUpdate = CreateChatUpdateType<"time">;
type NameChatUpdate = CreateChatUpdateType<"name">;

export type ChatUpdate =
	| UnreadCountChatUpdate
	| TimeChatUpdate
	| NameChatUpdate;

/* 
	SocketIO 
*/

export interface ServerToClient {
	message: (messages: MessageJson[]) => void;
	"message.update": (messages: MessageUpdate[]) => void;
	presence: (presences: DBContact[]) => void;
	"chats.update": (chats: ChatUpdate[]) => void;
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

	contacts: (reply: (contact: DBContact[]) => void) => void;

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
