import { config } from "dotenv";
import { join } from "path";

import { Client } from "@lib";

console.clear();

config();

const authFile = join(process.cwd(), "data", "auth.json");

const main = async (): Promise<void> => {
	const client = new Client(authFile);

	await client.init();
};

main().catch((err) => {
	console.error(err);
});
