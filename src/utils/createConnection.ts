import makeConnection, { useSingleFileAuthState } from "@adiwajshing/baileys";
import { Socket } from "@typings/Baileys";
import { ensureDir } from "fs-extra";
import { dirname } from "path";
import pino from "pino";

import { Client } from "@lib";

export const createConnection = async (client: Client): Promise<Socket> => {
	await ensureDir(dirname(client.authFile));
	const { state, saveState } = useSingleFileAuthState(client.authFile);

	const c = makeConnection({
		auth: state,
		printQRInTerminal: true,
		browser: ["Whatsapp Api", "Firefox", "v10"],
		logger: pino({
			transport: {
				target: "pino-pretty",
				options: {
					ignore: "pid,hostname,time",
				},
			},
		}),
	});

	c.ev
		.on("creds.update", saveState)
		.on("chats.upsert", (...data) => {
			console.log("chats.upsert", ...data);
		})
		.on("chats.update", (...data) => {
			console.log("chats.update", ...data);
		})
		.on("chats.set", (...data) => {
			console.log("chats.set", ...data);
		})
		.on("messages.set", (...data) => {
			console.log("messages.set", ...data);
		})
		.on("message-receipt.update", (...data) => {
			console.log("message-receipt.update", ...data);
		})
		.on("messages.update", (...data) => {
			console.log("messages.update", ...data);
		})
		.on("presence.update", (...data) => {
			console.log("presence.update", ...data);
		})
		.on("contacts.update", (...data) => {
			console.log("contacts.update", ...data);
		})
		.on("groups.update", (...data) => {
			console.log("groups.update", ...data);
		})
		.on("groups.upsert", (...data) => {
			console.log("groups.upsert", ...data);
		})
		.on("group-participants.update", (...data) => {
			console.log("group-participants.update", ...data);
		});

	return c;
};
