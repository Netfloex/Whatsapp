import {
	Contact,
	WAMessage,
	WAMessageContent,
} from "@adiwajshing/baileys-md/src";
import { DateTime } from "luxon";

import { parseTimestamp } from "@utils";

export class Message {
	wa: WAMessage;

	time?: DateTime;
	message?: WAMessageContent;
	sender?: string;
	fromMe?: boolean;

	content?: string;

	constructor(message: WAMessage, contacts: Contact[]) {
		this.wa = message;

		this.time = parseTimestamp(message.messageTimestamp);
		this.message = message?.message;

		this.fromMe = message.key.fromMe;

		const senderJid = message.participant ?? message.key.remoteJid;
		this.sender = message.key.fromMe
			? "You"
			: contacts.find((c) => c.id == senderJid)?.name ?? senderJid;

		this.content =
			message?.message?.conversation ??
			message?.message?.extendedTextMessage?.text ??
			message?.message?.imageMessage?.caption;
	}
}
