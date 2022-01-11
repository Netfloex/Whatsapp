import { DateTime } from "luxon";

export const parseTimestamp = (seconds: number | Long): DateTime =>
	DateTime.fromSeconds(+seconds);
