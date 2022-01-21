import { Chat as BaileysChat } from "@adiwajshing/baileys-md";
import { WAChat } from "@typings/Baileys";
import { ChatJson } from "@typings/SocketIO";

import { parseTimestamp } from "@utils";

export const Chat = (chat: Partial<BaileysChat | WAChat>): ChatJson => ({
	id: chat.id!,

	name: chat.name ?? undefined,

	time: parseTimestamp(
		typeof chat.conversationTimestamp == "object"
			? chat.conversationTimestamp?.low
			: chat.conversationTimestamp,
	),

	unreadCount: chat.unreadCount ?? undefined,
});
