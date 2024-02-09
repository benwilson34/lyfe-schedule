import { Dayjs } from "dayjs";

export function formatDayKey(day: Dayjs): string {
  return day.format('YYYY-MM-DD');
}

export function formatShownDate(day: Dayjs): string {
  return day.format('ddd MMM D');
}

export const formatTimeEstimate = (timeEstimateMins: number) => {
  let durationString = '';
  const hours = Math.floor(timeEstimateMins / 60);
  if (hours > 0) {
    durationString += `${hours}h`;
  }
  const mins = timeEstimateMins % 60;
  if (mins > 0) {
    durationString += `${mins}m`;
  }
  return durationString;
}

export const formatPercentage = (float: number) => `${Math.round(float * 100)}%`;
