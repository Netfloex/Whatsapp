import { Contact, WAMessage, WAMessageContent } from "@adiwajshing/baileys-md";
import { MessageJson } from "@typings/SocketIO";
import { pick } from "lodash";
import { DateTime } from "luxon";

import { parseTimestamp } from "@utils";

export class Message {
	private wa?: WAMessage;

	time?: DateTime;
	message?: WAMessageContent;
	sender?: string;
	fromMe?: boolean;
	chatJid?: string;

	content?: string;

	constructor(message: WAMessage, contacts: Contact[]) {
		this.wa = message;

		this.time = parseTimestamp(message.messageTimestamp);
		this.message = message?.message;
		this.chatJid = message.key.remoteJid;
		this.fromMe = message.key.fromMe;

		const senderJid = message.participant ?? message.key.remoteJid;
		this.sender =
			message.pushName ??
			(message.key.fromMe
				? "You"
				: contacts.find((c) => c.id == senderJid)?.name) ??
			senderJid;

		this.content =
			message?.message?.conversation ??
			message?.message?.extendedTextMessage?.text ??
			message?.message?.imageMessage?.caption;
	}

	toJSON(): MessageJson {
		return {
			...pick(this, "message", "sender", "fromMe", "chatJid", "content"),
			time: this.time.toJSON(),
		};
	}
}
