import { WAMessage } from "@adiwajshing/baileys-md/src";

export const getContent = (msg: WAMessage): string | WAMessage => {
	return (
		msg?.message?.conversation ??
		msg?.message?.extendedTextMessage?.text ??
		msg
	);
};
