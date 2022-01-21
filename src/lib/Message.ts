import { jidNormalizedUser, WAMessage } from "@adiwajshing/baileys-md";
import { MessageJson } from "@typings/SocketIO";

import { parseTimestamp } from "@utils";

const getSenderId = (message: WAMessage): string | undefined => {
	if (message.key.fromMe) return "me";

	const senderId =
		message.participant ||
		message.key.participant ||
		message.key.remoteJid ||
		undefined;
	let i: string | undefined;

	try {
		i = senderId && jidNormalizedUser(senderId);
	} catch (error) {
		console.log(error);
		console.log(message);
	}

	if (!i)
		console.log(
			"SENderid Undefined",
			`-${senderId}-`,
			message.participant,
			message.key.participant,
			message.key.remoteJid,
		);

	return i;
};

export const Message = (message: WAMessage): MessageJson => ({
	id: message.key.id!,
	time: parseTimestamp(message.messageTimestamp),
	message: JSON.stringify(message?.message),
	chatId: message.key.remoteJid ?? undefined,
	fromMe: message.key.fromMe ?? undefined,

	senderId: getSenderId(message),

	content:
		message?.message?.conversation ||
		message?.message?.extendedTextMessage?.text ||
		message?.message?.imageMessage?.caption ||
		(message?.message?.imageMessage != undefined ? "📷 Photo" : undefined),
});
