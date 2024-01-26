import { Dayjs } from "dayjs";

export function formatShownDate(day: Dayjs): string {
  return day.format('ddd MMM D');
}
