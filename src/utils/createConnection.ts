import makeConnection, {
	useSingleFileAuthState,
} from "@adiwajshing/baileys-md";
import { Socket } from "@typings/Baileys";
import { ensureDir } from "fs-extra";
import { dirname } from "path";
import P from "pino";

export const createConnection = async (authFile: string): Promise<Socket> => {
	await ensureDir(dirname(authFile));
	const { state, saveState } = useSingleFileAuthState(authFile);

	const c = makeConnection({
		auth: state,
		printQRInTerminal: true,
		logger: P({ level: "fatal", prettyPrint: true }),
	});

	c.ev.on("creds.update", saveState);

	return c;
};
