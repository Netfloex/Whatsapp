import { config } from "dotenv";
import { join } from "path";

import { Client } from "@lib";

console.clear();

config();

const dataDir = join(process.cwd(), "data");

const main = async (): Promise<void> => {
	const client = new Client(dataDir);
	await client.init();
};

main().catch((err) => {
	console.error(err);
});
