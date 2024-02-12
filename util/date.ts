import dayjs, { Dayjs, isDayjs } from "dayjs";
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
