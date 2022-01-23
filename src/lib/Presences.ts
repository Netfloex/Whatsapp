import { PresenceData } from "@adiwajshing/baileys";
import { DBContact } from "@typings/SocketIO";
import { DateTime } from "luxon";

export const Presences = (presences: {
	[participant: string]: PresenceData;
}): DBContact[] =>
	Object.entries(presences).map(([id, value]) => ({
		id,
		presence: value.lastKnownPresence,
		presenceUpdated: DateTime.now().toISO(),
	}));
