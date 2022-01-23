import { Contact, jidNormalizedUser, WAMessage } from "@adiwajshing/baileys";
import { MessageJson } from "@typings/SocketIO";

import { parseTimestamp } from "@utils";

const getSenderId = (message: WAMessage, me: Contact): string | undefined => {
	if (message.key.fromMe) return me.id;

	const senderId =
		message.participant ||
		message.key.participant ||
		message.key.remoteJid ||
		undefined;
	return senderId && jidNormalizedUser(senderId);
};

export const Message = (message: WAMessage, me: Contact): MessageJson => ({
	id: message.key.id!,
	time: parseTimestamp(message.messageTimestamp),
	message: JSON.stringify(message?.message),
	chatId: message.key.remoteJid ?? undefined,

	fromMe: message.key.fromMe == false ? 0 : 1,

	senderId: getSenderId(message, me),

	content:
		message?.message?.conversation ||
		message?.message?.extendedTextMessage?.text ||
		message?.message?.imageMessage?.caption ||
		(message?.message?.imageMessage != undefined ? "📷 Photo" : undefined),

	status: message.status ?? undefined,
});
