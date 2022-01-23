import { Chat as BaileysChat } from "@adiwajshing/baileys";
import { WAChat } from "@typings/Baileys";
import { ChatJson } from "@typings/SocketIO";

import { parseTimestamp } from "@utils";

export const Chat = (chat: Partial<BaileysChat | WAChat>): ChatJson => ({
	id: chat.id!,

	name: chat.name ?? undefined,

	time: parseTimestamp(chat.conversationTimestamp),

	unreadCount: chat.unreadCount ?? undefined,
});
