import makeConnection, {
	useSingleFileAuthState,
} from "@adiwajshing/baileys-md";
import { Socket } from "@typings/Baileys";
import { ensureDir } from "fs-extra";
import { dirname } from "path";
import P from "pino";

import { Client } from "@lib";

export const createConnection = async (client: Client): Promise<Socket> => {
	await ensureDir(dirname(client.authFile));
	const { state, saveState } = useSingleFileAuthState(client.authFile);

	const c = makeConnection({
		auth: state,
		printQRInTerminal: true,
		logger: P({ prettyPrint: true }),
	});

	c.ev
		.on("creds.update", saveState)
		.on("chats.upsert", (...data) => {
			console.log("chats.upsert", data);
		})
		.on("chats.update", (...data) => {
			console.log("chats.update", data);
		})
		.on("presence.update", (...data) => {
			console.log("presence.update", data);
		})
		.on("contacts.update", (...data) => {
			console.log("contacts.update", data);
		})
		.on("message-info.update", (...data) => {
			console.log("message-info.update", data);
		})
		.on("groups.update", (...data) => {
			console.log("groups.update", data);
		});

	return c;
};
