import { WAMessage, WAMessageContent } from "@adiwajshing/baileys-md";
import { MessageJson, Person } from "@typings/SocketIO";
import { pick } from "lodash";
import { DateTime } from "luxon";

import { Client } from "@lib";
import { parseTimestamp } from "@utils";

export class Message {
	private wa?: WAMessage;

	id?: string;
	time: DateTime;
	message?: WAMessageContent;
	sender: Person = {};
	fromMe?: boolean;
	chatId?: string;

	content?: string;

	constructor(message: WAMessage, client: Client) {
		this.wa = message;

		this.id = message.key.id ?? undefined;
		this.time = parseTimestamp(message.messageTimestamp);
		this.message = message?.message ?? undefined;
		this.chatId = message.key.remoteJid ?? undefined;
		this.fromMe = message.key.fromMe ?? undefined;

		this.sender.id = this.fromMe
			? client.store.data?.me?.id
			: message.participant ??
			  message.key.participant ??
			  message.key.remoteJid;

		this.sender.contactName = client.store.data?.contacts?.find(
			(c) => c.id == this.sender.id,
		)?.name;

		this.sender.pushname = this.fromMe
			? client.store.data?.me?.name
			: message.pushName;

		//  ??
		// (message.key.fromMe ? "You" : message.pushName) ??
		// senderJid;

		this.content =
			message?.message?.conversation ||
			message?.message?.extendedTextMessage?.text ||
			message?.message?.imageMessage?.caption ||
			undefined;
	}

	toJSON(): MessageJson {
		return {
			...pick(
				this,
				"id",
				"message",
				"sender",
				"fromMe",
				"chatId",
				"content",
			),
			time: this.time.toJSON(),
		};
	}
}
