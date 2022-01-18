import { Chat as BaileysChat, isJidGroup } from "@adiwajshing/baileys-md";
import { WAChat } from "@typings/Baileys";
import { ChatJson } from "@typings/SocketIO";
import { pick } from "lodash";
import { DateTime } from "luxon";

import { Client } from "@lib";
import { parseTimestamp } from "@utils";

export class Chat {
	private wa?: BaileysChat;

	id: string;
	name: string;
	time: DateTime;
	unreadCount?: number;
	isGroup: boolean;

	constructor(chat: BaileysChat, client: Client) {
		this.wa = chat;

		this.id = chat.id;

		this.name =
			chat.name ??
			client.store.data?.contacts?.find((c) => c.id == chat.id)?.name ??
			chat.id;

		this.time = parseTimestamp(
			(chat as WAChat)?.conversationTimestamp?.low,
		);

		this.unreadCount = chat.unreadCount ?? undefined;

		this.isGroup = isJidGroup(this.id);
	}

	toJSON(): ChatJson {
		return {
			...pick(this, "id", "name", "unreadCount", "isGroup"),
			time: this.time.toJSON(),
		};
	}
}
