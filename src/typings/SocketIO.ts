import type {
	AnyMessageContent,
	Chat,
	PresenceData,
} from "@adiwajshing/baileys-md";

export type PresenceUpdate = {
	id: string;
	presences: { [participant: string]: PresenceData };
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
	presence: (presence: PresenceUpdate) => void;
	"chats.update": (chats: Partial<Chat>[]) => void;
}

export interface ClientToServer {
	chats: (reply: (chats: ChatJson[]) => void) => void;

	"message.send": (
		message: AnyMessageContent & {
			jid: string;
		},
	) => void;

	"messages.for": (
		data: {
			chatId: string;
			length?: number;
		},
		reply: (messages: MessageJson[]) => void,
	) => void;

	"presence.subscribe": (
		jid: string,
		reply: (data: PresenceData | undefined) => void,
	) => void;
}
