import type { CalendarProps, TileContentFunc } from "react-calendar";
import dayjs from "@/lib/dayjs";
import Calendar from "react-calendar";

export const emptyDayTileContent = <div className="h-full"></div>;

export const contentClassName = 'react-calendar__month-view__days__day__content';

export const onTileContent: TileContentFunc = ({ date, view }) => {
  const day = dayjs(date);
  if (view !== "month") return null;
  const dayIsInPast = day.startOf("day").isBefore(dayjs().startOf("day"));
  return (
    <div className={`${contentClassName} flex flex-col justify-between items-start h-full w-full`}>
      {/* TODO add default classes, see node_modules\react-calendar\dist\Calendar.css */}
      {/* <div className='grow'>
        <div className={`${dayIsInPast ? 'crossed text-gray-400' : ''} border-gray-400/25 border-r-2 border-b-2 rounded-br-md pr-1`}>{day.format('DD')}</div>
      </div> */}
      {/* <div className='border-l-2'></div> */}
      {/* <div className='w-full flex justify-end'>
        <div className={`${count > 0 ? 'text-black' : 'text-black/25'} text-xs italic text-right align-text-bottom`}>{count}</div>
      </div> */}
    </div>
  );
};

export const onTileClassName = ({
  date,
  view,
}: {
  date: Date;
  view: string;
}) => {
  let classes = "p-0 h-10 rounded-lg text-xs text-ondark align-top";
  if (view === "month") {
    classes += " text-left";
  }
  if (dayjs(date).startOf("day") < dayjs().startOf("day")) {
    return `${classes} bg-general-200 border-2 border-general-200`;
  }
  return `${classes} bg-general-500 border-2 border-general-500`;
};

const formatWeekday = (locale: string | undefined, date: Date): string => {
  // TODO handle other locales
  if (locale && locale !== "en-us") {
    return date.toLocaleDateString(locale, { weekday: "short" });
  }
  const shortWeekdayName = date.toLocaleDateString(locale, {
    weekday: "short",
  });
  switch (dayjs(date).day()) {
    case 0:
    case 2:
    case 4:
    case 6:
      return shortWeekdayName.substring(0, 2);
    default:
      return shortWeekdayName.substring(0, 1);
  }
};

export function CalendarPicker(props: CalendarProps) {
  return (
    <Calendar
      calendarType="gregory"
      minDetail="decade"
      prev2Label={null}
      next2Label={null}
      tileContent={onTileContent}
      tileClassName={onTileClassName}
      formatShortWeekday={formatWeekday}
      {...props}
    />
  );
}
