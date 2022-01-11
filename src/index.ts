import { join } from "path";

import { Client } from "@lib";

console.clear();

const authFile = join(process.cwd(), "data", "auth.json");

const main = async (): Promise<void> => {
	const client = new Client(authFile);
	await client.init();

	client.chats.splice(0, 30).forEach((chat) => {
		console.log(
			chat.name,
			chat.messages.map((msg) => `${msg.sender}: ${msg.content}`),
		);
	});
};

main().catch((err) => {
	console.error(err);
});
