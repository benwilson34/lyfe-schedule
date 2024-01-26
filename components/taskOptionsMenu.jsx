/**
 * @see https://tailwindui.com/components/marketing/elements/flyout-menus#component-911576fb54922e5199a9434ca8a273fd
 * 
 * @todo convert to Typescript
 */

import { Fragment, useCallback } from 'react'
import dayjs from 'dayjs';
import { Popover, Transition } from '@headlessui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis, faPenToSquare, faTrash, faArrowTurnRight, faPersonWalkingArrowRight } from '@fortawesome/free-solid-svg-icons';
import { formatShownDate } from '@/util/format';

const Day = {
  SUN: 0,
  MON: 1,
  TUES: 2,
  WEDS: 3,
  THUR: 4,
  FRI: 5,
  SAT: 6,
};

export default function TaskOptionsMenu({ task, selectedDay, onEditClick, onPostponeClick, onDeleteClick }) {
  const selectedDayIsToday = selectedDay.isSame(dayjs().startOf('day'), 'day');
  const selectedDayIsWeekend = [Day.SAT, Day.SUN].includes(selectedDay.day());

  const getNextDayOfWeek = useCallback((selectedDay, dayOfWeek) => {
    const currentWeekday = selectedDay.day();
    if (currentWeekday === dayOfWeek) {
      return selectedDay.add(7, 'day');
    }
    const daysToAdd = (dayOfWeek - currentWeekday + 7) % 7;
    return selectedDay.add(daysToAdd, 'day');
  }, []);

  const nextDay = selectedDay.add(1, 'day');
  const weekendDay = getNextDayOfWeek(selectedDay, Day.SAT);
  const nextWeekDay = getNextDayOfWeek(selectedDay, Day.MON);

  const renderProjectedMenuBody = (close) => (
    <div className="p-1">
      <div className="italic text-center text-sm">
        projected repeating task
      </div>
      <div 
        // onClick={() => { onEditClick(); close(); }}
        className="group relative flex items-center gap-x-2 rounded-lg p-1 hover:bg-gray-50 cursor-pointer"
      >
        <FontAwesomeIcon icon={faPersonWalkingArrowRight} className="h-4 w-4 text-gray-600 group-hover:text-indigo-600" aria-hidden="true" />
        <div>
          <span className="font-semibold text-gray-900 line-through">
            jump to active (TODO)
          </span>
        </div>
      </div>
    </div>
  );

  const renderMenuBody = (close) => (
    <div className="max-w-xs flex-auto overflow-hidden rounded-lg bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5">
      {task.isProjected
        ? renderProjectedMenuBody(close)
        : (
          <div className="p-1">
            {!task.completedDate &&
              <div 
                onClick={() => { onEditClick(); close(); }}
                className="group relative flex items-center gap-x-2 rounded-lg p-1 hover:bg-gray-50 cursor-pointer"
              >
                {/* <div className="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white"> */}
                  <FontAwesomeIcon icon={faPenToSquare} className="h-4 w-4 text-gray-600 group-hover:text-indigo-600" aria-hidden="true" />
                {/* </div> */}
                <div>
                  <span className="font-semibold text-gray-900">
                    edit
                  </span>
                  {/* <p className="mt-1 text-gray-600">{item.description}</p> */}
                </div>
              </div>
            }

            <div className="border-t-2" />

            <div className={`relative flex flex-col gap-x-6 p-1 ${task.isProjected && 'bg-gray-200'}`}>
              <div className={`relative flex items-center gap-x-2 ${task.isProjected && 'line-through'}`}>
                <FontAwesomeIcon icon={faArrowTurnRight} className="h-4 w-4 text-gray-600" aria-hidden="true" />
                <span className="font-semibold text-gray-900">
                  postpone to
                </span>
              </div>
              <div className="group relative flex flex-col pl-2">
                <div onClick={() => { onPostponeClick(nextDay); close(); }} className="rounded-lg p-1 hover:bg-gray-50 cursor-pointer">
                  {selectedDayIsToday ? 'tomorrow' : 'next day'} ({formatShownDate(nextDay)})
                </div>
                <div onClick={() => { onPostponeClick(weekendDay); close(); }} className="rounded-lg p-1 hover:bg-gray-50 cursor-pointer">
                  {selectedDayIsWeekend && 'next '} weekend ({formatShownDate(weekendDay)})
                </div>
                <div onClick={() => { onPostponeClick(nextWeekDay); close(); }} className="rounded-lg p-1 hover:bg-gray-50 cursor-pointer">
                  next week ({formatShownDate(nextWeekDay)})
                </div>
                <div className="rounded-lg p-1 hover:bg-gray-50 line-through">
                  another day (TODO)
                </div>
              </div>
            </div>

            <div className="border-t-2" />

            <div onClick={() => { onDeleteClick(); close(); }} className="group relative flex items-center gap-x-2 rounded-lg p-1 hover:bg-gray-50 cursor-pointer">
              <FontAwesomeIcon icon={faTrash} className="h-4 w-4 text-gray-600 group-hover:text-indigo-600" aria-hidden="true" />
              <div>
                <span className="font-semibold text-gray-900">
                  delete
                </span>
                {/* <p className="mt-1 text-gray-600">{item.description}</p> */}
              </div>
            </div>
          </div>
        )
      }
    </div>
  );

  return (
    <Popover className="relative">
      <Popover.Button className="inline-flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900">
        <FontAwesomeIcon icon={faEllipsis} className="text-transparent group-hover/task:text-gray-500" />
      </Popover.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute center-0 z-10 mt-5 flex w-screen max-w-max -translate-x-full px-4">
          {({ close }) => renderMenuBody(close)}
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}
