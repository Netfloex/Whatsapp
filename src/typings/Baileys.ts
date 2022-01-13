import makeConnection, {
	Chat,
	Contact,
	WAMessage,
} from "@adiwajshing/baileys-md";

export type WAChat = Chat & {
	conversationTimestamp?: {
		low: number;
	};
};

export type ChatSet = {
	chats: WAChat[];
	messages: WAMessage[];
	contacts: Contact[];
};

export type Socket = ReturnType<typeof makeConnection>;
