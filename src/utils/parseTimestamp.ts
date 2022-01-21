import { DateTime } from "luxon";

export const parseTimestamp = (
	seconds: number | Long | null | undefined,
): string | undefined =>
	!seconds ? undefined : DateTime.fromSeconds(+seconds).toISO();
