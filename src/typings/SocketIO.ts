import type {
	AnyMessageContent,
	Chat,
	PresenceData,
	WAMessageContent,
} from "@adiwajshing/baileys-md";

export type PresenceUpdate = {
	id: string;
	presences: { [participant: string]: PresenceData };
};

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
	unreadCount?: number;
	isGroup: boolean;
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
