/**
 * @see https://tailwindui.com/components/marketing/elements/flyout-menus#component-911576fb54922e5199a9434ca8a273fd
 */

import { Fragment, forwardRef, useCallback, useEffect } from "react";
import dayjs, { Dayjs } from "@/lib/dayjs";
import { Popover, Transition } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsis,
  faPenToSquare,
  faTrash,
  faArrowTurnRight,
  faPersonWalkingArrowRight,
  faCircleLeft,
} from "@fortawesome/free-solid-svg-icons";
import { formatShownDate } from "@/util/format";
import { TaskViewModel as Task } from "@/types/task.viewModel";
import { UseFloatingReturn } from "@floating-ui/react";

const Day: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUES: 2,
  WEDS: 3,
  THUR: 4,
  FRI: 5,
  SAT: 6,
};

// Using a ref so I can hook into the click handler...can't tell if this is the right approach
// let MyCustomButton = forwardRef(function MyCustomButton(props, ref) {
//   const className = `${props.className} test-test-test`;
//   const onClick = (...args) => {
//     props.onClick(...args);
//     console.log('>> does this work?');
//     console.log(args);
//   };
//   // console.log(props);
//   return <button ref={ref} {...props} className={className} onClick={onClick} />;
// });

export default function TaskOptionsMenu({
  task,
  isDisabled,
  buttonClasses = "",
  selectedDay,
  onMenuOpenChange = () => {},
  onEditClick,
  onPostponeClick,
  onPostponeToAnotherDayClick,
  onCompleteOnAnotherDayClick,
  onDeleteClick,
  floating,
}: {
  task: Task;
  isDisabled: boolean;
  buttonClasses?: string;
  selectedDay: Dayjs;
  onMenuOpenChange: (isOpen: boolean) => void;
  onEditClick: () => void;
  onPostponeClick: (postponeDay: Dayjs) => void;
  onPostponeToAnotherDayClick: () => void;
  onCompleteOnAnotherDayClick: () => void;
  onDeleteClick: () => void;
  floating: UseFloatingReturn;
}) {
  const { refs, floatingStyles } = floating;
  const selectedDayIsToday = selectedDay.isSame(dayjs().startOf("day"), "day");
  const selectedDayIsWeekend = [Day.SAT, Day.SUN].includes(selectedDay.day());

  const getNextDayOfWeek = useCallback(
    (selectedDay: Dayjs, dayOfWeek: number) => {
      const currentWeekday = selectedDay.day();
      if (currentWeekday === dayOfWeek) {
        return selectedDay.add(7, "day");
      }
      const daysToAdd = (dayOfWeek - currentWeekday + 7) % 7;
      return selectedDay.add(daysToAdd, "day");
    },
    []
  );

  const nextDay = selectedDay.add(1, "day");
  const weekendDay = getNextDayOfWeek(selectedDay, Day.SAT);
  const nextWeekDay = getNextDayOfWeek(selectedDay, Day.MON);

  const renderProjectedMenuBody = (close: () => void) => (
    <div className="p-1">
      <div className="italic text-center text-sm">projected repeating task</div>
      <div
        // onClick={() => { onEditClick(); close(); }}
        className="group relative flex items-center gap-x-2 rounded-lg p-1 hover:bg-gray-50 cursor-pointer"
      >
        <FontAwesomeIcon
          icon={faPersonWalkingArrowRight}
          className="h-4 w-4 text-gray-600 group-hover:text-indigo-600"
          aria-hidden="true"
        />
        <div>
          <span className="font-semibold text-gray-900 line-through">
            jump to active (TODO)
          </span>
        </div>
      </div>
    </div>
  );

  const renderMenuBody = (close: () => void) => {
    return (
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="flex-auto overflow-hidden rounded-2xl bg-background text-xs leading-6 shadow-lg ring-1 ring-gray-900/5 text-general"
      >
        {task.isProjected ? (
          renderProjectedMenuBody(close)
        ) : (
          <div className="px-4 py-1">
            {!task.completedDate && (
              <>
                <div
                  onClick={() => {
                    onEditClick();
                    close();
                  }}
                  className="group relative flex items-center gap-x-2 rounded-lg p-1 hover:bg-gray-50 cursor-pointer"
                >
                  {/* <div className="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white"> */}
                  <FontAwesomeIcon
                    icon={faPenToSquare}
                    className="h-4 w-4  group-hover:text-indigo-600"
                    aria-hidden="true"
                  />
                  {/* </div> */}
                  <div>
                    <span className="font-semibold">Edit</span>
                    {/* <p className="mt-1 text-gray-600">{item.description}</p> */}
                  </div>
                </div>

                <div className="border-t-[1px] border-general" />

                <div
                  className={`relative flex flex-col gap-x-6 p-1 ${
                    task.isProjected && "bg-gray-200"
                  }`}
                >
                  <div
                    className={`relative flex items-center gap-x-2 ${
                      task.isProjected && "line-through"
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={faArrowTurnRight}
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    <span className="">Postpone to</span>
                  </div>
                  <div className="group relative flex flex-col pl-6 font-semibold">
                    <div
                      onClick={() => {
                        onPostponeClick(nextDay);
                        close();
                      }}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      {selectedDayIsToday ? "Tomorrow" : "Next day"} (
                      {formatShownDate(nextDay)})
                    </div>
                    <div
                      onClick={() => {
                        onPostponeClick(weekendDay);
                        close();
                      }}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      {selectedDayIsWeekend ? "Next weekend" : "Weekend"} (
                      {formatShownDate(weekendDay)})
                    </div>
                    <div
                      onClick={() => {
                        onPostponeClick(nextWeekDay);
                        close();
                      }}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      Next week ({formatShownDate(nextWeekDay)})
                    </div>
                    <div
                      onClick={() => {
                        onPostponeToAnotherDayClick();
                        close();
                      }}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      Another day
                    </div>
                  </div>
                </div>

                <div className="border-t-[1px] border-general" />

                <div
                  onClick={() => {
                    onCompleteOnAnotherDayClick();
                    close();
                  }}
                  className="group relative flex items-center gap-x-2 rounded-lg p-1 hover:bg-gray-50 cursor-pointer"
                >
                  <FontAwesomeIcon
                    icon={faCircleLeft}
                    className="h-4 w-4  group-hover:text-indigo-600"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="font-semibold">
                      Complete on a previous day
                    </span>
                  </div>
                </div>

                <div className="border-t-[1px] border-general" />
              </>
            )}

            <div
              onClick={() => {
                onDeleteClick();
                close();
              }}
              className="group relative flex items-center gap-x-2 rounded-lg p-1 hover:bg-gray-50 cursor-pointer"
            >
              <FontAwesomeIcon
                icon={faTrash}
                className="h-4 w-4 group-hover:text-indigo-600"
                aria-hidden="true"
              />
              <div>
                <span className="font-semibold">Delete</span>
                {/* <p className="mt-1 text-gray-600">{item.description}</p> */}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Popover className="relative">
      {({ open }) => {
        // not the best approach but idk what else to do since I can't control the state directly
        // see: https://stackoverflow.com/questions/74780628/changing-popover-internal-state-headless-ui
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          onMenuOpenChange(open);
        }, [open]);

        return (
          <>
            <Popover.Button
              disabled={isDisabled}
              className="text-base font-semibold"
            >
              {/* <FontAwesomeIcon icon={faEllipsis} className="text-transparent group-hover/task:text-gray-500" /> */}
              <FontAwesomeIcon icon={faEllipsis} className={buttonClasses} />
            </Popover.Button>

            {/* <Popover.Overlay></Popover.Overlay> */}
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition linear duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute z-10 center-0 mt-5 flex w-screen min-w-max -translate-x-full px-4">
                {({ close }) => renderMenuBody(close)}
              </Popover.Panel>
            </Transition>
          </>
        );
      }}
    </Popover>
  );
}
