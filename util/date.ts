import dayjs, { Dayjs, isDayjs } from "@/lib/dayjs";
import { lerp } from "./math";

export function calculatePriority(
  startDate: Dayjs | Date,
  endDate: Dayjs | Date,
  currentDay: Dayjs | Date
) {
  const MIN_PRIORITY = 0;
  const MAX_PRIORITY = 1;
  // TODO handle different start time (assumed to be start of day)
  const conformedStartDate = (isDayjs(startDate) ? startDate : dayjs(startDate)).startOf('day');
  // TODO handle different end time (assumed to be end of day)
  const conformedEndDate = (isDayjs(endDate) ? endDate : dayjs(endDate)).endOf('day');
  const conformedCurrentDay = isDayjs(currentDay)
    ? currentDay
    : dayjs(currentDay);
  const rangeHours = conformedEndDate.diff(conformedStartDate, "hours");
  const elapsedHours = conformedCurrentDay.diff(conformedStartDate, "hours");
  return lerp(MIN_PRIORITY, MAX_PRIORITY, elapsedHours / rangeHours);
}

export function stripOffset(date: string | Date | Dayjs): Dayjs {
  const conformedDate = isDayjs(date) ? date : dayjs(date);
  const formattedDate = conformedDate.format('YYYY-MM-DDTHH:mm:ss');
  return dayjs.utc(formattedDate);
}

// This is needed because `Date.toISOString()` is *always* in UTC, which messes up the frontend calculations.
// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
export function getCanonicalDatestring(date: Date | Dayjs, doStripOffset: boolean = true): string {
  const str = (doStripOffset ? stripOffset(date) : date).toISOString();
  return str.substring(0, str.length - 1); // remove the last character, 'Z'
}
