import makeConnection, { Chat } from "@adiwajshing/baileys";

export type WAChat = Chat & {
	conversationTimestamp?: {
		low: number;
	};
};

export type Socket = ReturnType<typeof makeConnection>;
