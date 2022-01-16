import { DateTime } from "luxon";

export const parseTimestamp = (
	seconds: number | Long | null | undefined,
): DateTime => DateTime.fromSeconds(+(seconds ?? 0));
