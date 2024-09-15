import { Dayjs } from "@/lib/dayjs";

export function formatDayKey(day: Dayjs): string {
  return day.format('YYYY-MM-DD');
}

export function formatShownDate(day: Dayjs): string {
  return day.format('ddd MMM D');
}

export function formatFriendlyFullDate(day: Dayjs): string {
  return day.format('dddd YYYY-MM-DD HH:mm:ss Z');
}

export const formatTimeEstimate = (timeEstimateMins: number): string => {
  if (!timeEstimateMins) {
    return '';
  }
  let durationString = '';
  const hours = Math.floor(timeEstimateMins / 60);
  if (hours > 0) {
    durationString += `${hours}h`;
  }
  const mins = timeEstimateMins % 60;
  if (mins > 0) {
    durationString += `${mins}m`;
  }
  return durationString || '0m';
}

export const formatPercentage = (float: number) => `${Math.round(float * 100)}%`;

export const formatRepeatInterval = (repeatDays: number): string => {
  if (!repeatDays) {
    return '';
  }
  return `${repeatDays}d`;
  // let durationString = '';
  // const DAYS_PER_WEEK = 7;
  // const weeks = Math.floor(repeatDays / DAYS_PER_WEEK);
  // if (weeks > 0) {
  //   durationString += `${weeks}w`;
  // }
  // const days = repeatDays % DAYS_PER_WEEK;
  // if (days > 0) {
  //   durationString += `${days}d`;
  // }
  // return durationString;
}
