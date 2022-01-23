import { toNumber } from "@adiwajshing/baileys";
import { DateTime } from "luxon";

export const parseTimestamp = (
	seconds: number | Long | null | undefined,
): string | undefined =>
	!seconds ? undefined : DateTime.fromSeconds(toNumber(seconds)).toISO();
