import { WAMessage, WAMessageContent } from "@adiwajshing/baileys-md";
import { MessageJson, Person } from "@typings/SocketIO";
import { pick } from "lodash";
import { DateTime } from "luxon";

import { Client } from "@lib";
import { parseTimestamp } from "@utils";

export class Message {
	private wa?: WAMessage;

	id?: string;
	time?: DateTime;
	message?: WAMessageContent;
	sender?: Person = { id: "" };
	fromMe?: boolean;
	chatId?: string;

	content?: string;

	constructor(message: WAMessage, client: Client) {
		this.wa = message;

		this.id = message.key.id;
		this.time = parseTimestamp(message.messageTimestamp);
		this.message = message?.message;
		this.chatId = message.key.remoteJid;
		this.fromMe = message.key.fromMe;

		this.sender.id = this.fromMe ? client.me.id : message.key.participant;

		this.sender.contactName = client.data.contacts.find(
			(c) => c.id == this.sender.id,
		)?.name;
		this.sender.pushname = message.pushName;
		//  ??
		// (message.key.fromMe ? "You" : message.pushName) ??
		// senderJid;

		this.content =
			message?.message?.conversation ??
			message?.message?.extendedTextMessage?.text ??
			message?.message?.imageMessage?.caption;
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
