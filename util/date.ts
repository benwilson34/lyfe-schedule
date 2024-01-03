import dayjs, { Dayjs } from "dayjs";

// TODO remove - these aren't needed thanks to dayjs.endOf('day')

export function startOfTheDay(date: Dayjs): Dayjs {
  return dayjs(date).set('hour', 0).set('minute', 0).set('second', 0);
}

export function endOfTheDay(date: Dayjs): Dayjs {
  return dayjs(date).set('hour', 23).set('minute', 59).set('second', 0);
}
