import { Chat as BaileysChat, isJidGroup } from "@adiwajshing/baileys-md";
import { WAChat } from "@typings/Baileys";
import { ChatJson, MessageJson } from "@typings/SocketIO";
import { pick } from "lodash";
import { DateTime } from "luxon";
import { EventEmitter } from "stream";

import { Client, Message } from "@lib";
import { parseTimestamp } from "@utils";

export class Chat extends EventEmitter {
	private wa?: BaileysChat;

	id: string;
	name: string;
	time: DateTime;
	messages: MessageJson[];
	unreadCount?: number;
	isGroup: boolean;

	constructor(chat: BaileysChat, client: Client) {
		super();
		this.wa = chat;

		this.id = chat.id;

		this.name =
			chat.name ??
			client.store.data?.contacts?.find((c) => c.id == chat.id)?.name ??
			chat.id;

		this.messages =
			client.store.data.messages
				?.filter((msg) => msg.key.remoteJid == chat.id)
				.map((msg) => new Message(msg, client))
				.sort((a, b) => b.time.valueOf() - a.time.valueOf())
				.map((msg) => msg.toJSON()) ?? [];

		this.time = this.messages.length
			? DateTime.fromISO(this.messages[0].time)
			: parseTimestamp((chat as WAChat)?.conversationTimestamp?.low);

		this.unreadCount = chat.unreadCount ?? undefined;

		this.isGroup = isJidGroup(this.id);
	}
	toJSON(): ChatJson {
		return {
			...pick(this, "id", "name", "unreadCount", "messages", "isGroup"),
			time: this.time.toJSON(),
		};
	}
}
