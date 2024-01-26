import type { CalendarProps, TileContentFunc } from "react-calendar";
import dayjs from "dayjs";
import Calendar from "react-calendar";

export const onTileContent: TileContentFunc = ({ date, view }) => {
  const day = dayjs(date);
  if (view !== 'month') return null;
  const dayIsInPast = day.startOf('day').isBefore(dayjs().startOf('day'));
  return (
    <div className='flex flex-col justify-between items-start h-full w-full p-1'>
      {/* TODO add default classes, see node_modules\react-calendar\dist\Calendar.css */}
      <div className='grow'>
        <div className={`${dayIsInPast ? 'crossed text-gray-400' : ''} border-gray-400/25 border-r-2 border-b-2 rounded-br-md pr-1`}>{day.format('DD')}</div>
      </div>
      {/* <div className='border-l-2'></div> */}
      {/* <div className='w-full flex justify-end'>
        <div className={`${count > 0 ? 'text-black' : 'text-black/25'} text-xs italic text-right align-text-bottom`}>{count}</div>
      </div> */}
    </div>
  );
}

export const onTileClassName = ({ date, view }: { date: Date, view: string }) => {
  const commonClasses = 'p-0 h-10 rounded-lg text-left align-top shadow-md';
  if (view !== 'month') return commonClasses;
  if (dayjs(date).startOf('day') < dayjs().startOf('day')) {
    return `${commonClasses} bg-gray-300`;
  }
  return `${commonClasses} border-black border-1`;
}

export function CalendarPicker(props: CalendarProps) {
  return (
    <Calendar 
      minDetail='decade'
      tileContent={onTileContent}
      tileClassName={onTileClassName}
      {...props}
    />
  );
}