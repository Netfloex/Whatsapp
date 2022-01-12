import { Contact, WAMessage } from "@adiwajshing/baileys-md/src";
import { WAChat } from "@typings/Baileys";
import { pick } from "lodash";
import { DateTime } from "luxon";
import { Message } from "src/lib/Message";
import { EventEmitter } from "stream";

import { parseTimestamp } from "@utils";

export class Chat extends EventEmitter {
	private wa?: WAChat;

	name: string;
	time: DateTime;
	messages: Message[];
	unreadCount?: number;

	constructor(chat: WAChat, contacts: Contact[], messages: WAMessage[]) {
		super();
		this.wa = chat;

		this.name =
			chat.name ?? contacts.find((c) => c.id == chat.id)?.name ?? chat.id;

		this.messages = messages
			.filter((msg) => msg.key.remoteJid == chat.id && "message" in msg)
			.map((msg) => new Message(msg, contacts))
			.sort((a, b) => b.time.toMillis() - a.time.toMillis());

		this.time = this.messages.length
			? this.messages[0].time
			: parseTimestamp(chat.conversationTimestamp.low);

		this.unreadCount = chat.unreadCount;
	}
	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	toJSON() {
		return {
			...pick(this, "name", "time"),
			messages: this.messages.map((msg) => msg.toJSON()),
		};
	}
}
