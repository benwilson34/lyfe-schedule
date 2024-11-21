import dayjs, { Dayjs, isDayjs } from "@/lib/dayjs";

export function asEndDate(date: Dayjs | Date): Dayjs {
  // would be better to do `.add(1, "day").startOf("day")`?
  return (isDayjs(date) ? date : dayjs(date)).endOf("day").add(1, "minute");
}

export function stripOffset(date: string | Date | Dayjs): Dayjs {
  const conformedDate = isDayjs(date) ? date : dayjs(date);
  const formattedDate = conformedDate.format("YYYY-MM-DDTHH:mm:ss");
  return dayjs.utc(formattedDate);
}

// This is needed because `Date.toISOString()` is *always* in UTC, which messes up the frontend calculations.
// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
export function getCanonicalDatestring(
  date: Date | Dayjs,
  doStripOffset: boolean = true
): string {
  const str = (doStripOffset ? stripOffset(date) : date).toISOString();
  return str.substring(0, str.length - 1); // remove the last character, 'Z'
}
