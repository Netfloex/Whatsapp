import makeConnection, { Chat } from "@adiwajshing/baileys-md";

export type WAChat = Chat & {
	conversationTimestamp?: {
		low: number;
	};
};

export type Socket = ReturnType<typeof makeConnection>;
