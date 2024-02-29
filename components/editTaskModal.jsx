/**
 * @see https://tailwindui.com/components/application-ui/overlays/modals
 *
 * TODO convert to typescript...need to find type definitions somewhere
 */

import {
  Fragment,
  useCallback,
  useRef,
  useState,
  useMemo,
  useEffect,
} from "react";
import { Dialog, Transition } from "@headlessui/react";
import dayjs from "dayjs";
import { calculateRangeDays } from "@/util/task";
import { assign } from "lodash";
import {
  CalendarPicker,
  contentClassName,
  emptyDayTileContent,
} from "./CalendarPicker";
// import './editTaskModal.css';
import { Exo_2 } from "next/font/google";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faHourglass,
} from "@fortawesome/free-solid-svg-icons";

const exo2 = Exo_2({ subsets: ["latin"] });

const Bound = {
  START: "start",
  END: "end",
};

export function EditTaskModal({ isOpen, setIsOpen, task, setTasks, initialStartDate } = { initialStartDate: dayjs() }) {
  const isNewTask = useMemo(() => !task, [task]);
  const [title, setTitle] = useState(task?.title || "");
  // TODO handle `useStartTime === true`
  const [startDate, setStartDate] = useState(task?.startDate || initialStartDate);
  // TODO handle `useEndTime === true`
  const [endDate, setEndDate] = useState(task?.endDate || initialStartDate);
  const [rangeDays, setRangeDays] = useState(task?.rangeDays || 0);
  const [isRepeating, setIsRepeating] = useState(!!task?.repeatDays || false);
  const [repeatDays, setRepeatDays] = useState(task?.repeatDays || 1);
  const [hasTimeEstimate, setHasTimeEstimate] = useState(
    !!task?.timeEstimateMins || true
  );
  const [timeEstimateMins, setTimeEstimateMins] = useState(
    task?.timeEstimateMins || 15
  );
  const [isLoading, setIsLoading] = useState(false);
  const [mostRecentlySetDate, setMostRecentlySetDate] = useState(Bound.END);

  // type DateField = 'startDate' | 'endDate' | 'rangeDays';
  const [lockedField, setLockedField] = useState("rangeDays");

  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (lockedField === "rangeDays") {
      setRangeDays(calculateRangeDays(startDate, endDate));
      return;
    }
    // TODO calculate other locked fields startDate and endDate
    throw new Error("Not implemented yet");
  }, [lockedField, startDate, endDate]);

  const isValid = useMemo(() => {
    // TODO validate new task
    const isValidTitle = typeof title === "string" && title.trim().length > 0;
    return isValidTitle;
  }, [title]);

  const handleClickDay = useCallback(
    (value) => {
      const chosenDate = dayjs(value);
      if (mostRecentlySetDate === Bound.END) {
        setStartDate(chosenDate);
        setEndDate(chosenDate);
        setMostRecentlySetDate(Bound.START);
        return;
      }
      if (chosenDate.isBefore(startDate)) {
        // swap bounds
        setEndDate(startDate)
        setStartDate(chosenDate);
      } else {
        setEndDate(chosenDate);
      }
      setMostRecentlySetDate(Bound.END);
    },
    [mostRecentlySetDate, startDate]
  );

  const tileContent = useCallback(
    ({ date, view }) => {
      if (view !== "month") return null;
      if (!isRepeating) return emptyDayTileContent;
      const startOfDate = dayjs(date).startOf("day");
      if (startOfDate < dayjs().startOf("day") || startOfDate < startDate) {
        return emptyDayTileContent;
      }
      const daysFromStartDate = dayjs(date).diff(startDate, "days");
      if (daysFromStartDate !== 0 && daysFromStartDate % repeatDays === 0) {
        return (
          <div className={`${contentClassName} flex justify-center items-end w-full`}>
            <span className="text-base leading-none">
              <FontAwesomeIcon icon={faArrowsRotate}></FontAwesomeIcon>
            </span>
          </div>
        );
      }
      return emptyDayTileContent;
    },
    [isRepeating, startDate, repeatDays]
  );

  const onAddButtonClick = useCallback(async () => {
    try {
      /* type: Task */
      const taskToAdd = {
        title,
        startDate: dayjs(startDate),
        endDate: dayjs(endDate),
        rangeDays,
        ...(isRepeating && { repeatDays }),
        timeEstimateMins,
      };

      setIsLoading(true);
      const result = await fetch(`/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...taskToAdd,
          startDate: dayjs(startDate).toISOString(),
          endDate: dayjs(endDate).toISOString(),
        }),
      });
      const body = await result.json();
      if (result.status === 200) {
        taskToAdd.id = body.data.taskId;
      } else {
        throw new Error(`>> error: ${JSON.stringify(body)}`);
      }
      setTasks((tasks) => [...tasks, taskToAdd]);
      setIsOpen(false);
      // TODO show some confimation message
    } catch (error) {
      console.error(error);
      // TODO show some error message
    } finally {
      setIsLoading(false);
    }
  }, [
    title,
    startDate,
    endDate,
    rangeDays,
    isRepeating,
    repeatDays,
    timeEstimateMins,
    setTasks,
    setIsOpen,
  ]);

  const onSaveButtonClick = useCallback(async () => {
    try {
      const taskToSave = {
        title,
        startDate: dayjs(startDate),
        endDate: dayjs(endDate),
        rangeDays,
        ...(isRepeating && { repeatDays }),
        timeEstimateMins,
      };

      setIsLoading(true);
      const result = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...taskToSave,
          startDate: dayjs(startDate).toISOString(),
          endDate: dayjs(endDate).toISOString(),
        }),
      });
      const body = await result.json();
      if (result.status === 200) {
        // console.log('>> Success!!');
        // taskToAdd.id = body.data.taskId;
      } else {
        throw new Error(`>> error: ${JSON.stringify(body)}`);
      }
      setTasks((tasks) => {
        return tasks.map((t) => {
          if (t.id !== task.id) return t;
          return { ...taskToSave, id: task.id };
        });
      });
      setIsOpen(false);
      // TODO show some confimation message
    } catch (error) {
      console.error(error);
      // TODO show some error message
    } finally {
      setIsLoading(false);
    }
  }, [
    title,
    startDate,
    endDate,
    rangeDays,
    isRepeating,
    repeatDays,
    timeEstimateMins,
    task,
    setTasks,
    setIsOpen,
  ]);

  const formatDate = useCallback((date) => date.format("ddd MMM D, YYYY"), []);

  if (!isOpen) return null;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className={`${exo2.className} relative z-10`}
        initialFocus={cancelButtonRef}
        onClose={setIsOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-disabled-200/75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full justify-center p-4 text-center items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-background text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="px-8 sm:px-12 pt-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3">
                      <Dialog.Title
                        as="h3"
                        className="text-lg text-center font-semibold leading-6 uppercase mb-6"
                      >
                        {isNewTask ? "Add" : "Edit"} task
                      </Dialog.Title>
                      <div className="">
                        <div className="flex w-full max-w-full mb-4 px-4 py-2 bg-general-100 shadow-md rounded-xl">
                          <span className="mr-2 font-semibold">
                            Title<span className="text-attention">*</span>:
                          </span>
                          {/* <div className="flex-grow bg-warning"></div> */}
                          <input
                            className="flex-grow min-w-0 bg-transparent border-b-[1px] border-general"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                          ></input>
                        </div>

                        <div className="mb-4 ring-2 ring-general-200 rounded-lg p-2">
                          <div className="font-semibold">Schedule:</div>
                          <div className="text-sm text-general-200 leading-none italic">
                            {/* TODO this would be better as a tooltip */}
                            Click once to choose a single day. Click again to choose a range.
                          </div>
                          <CalendarPicker
                            value={[
                              startDate.startOf('day').toDate(),
                              endDate.endOf('day').toDate(),
                            ]}
                            onClickDay={handleClickDay}
                            tileContent={tileContent}
                            disabled={isLoading || lockedField === "startDate"}
                            className="mx-auto mb-4"
                          />
                          <div className="flex flex-col px-4 py-2 bg-disabled-100 rounded-xl text-ondisabled">
                            <div>
                              <span className="mr-2 font-semibold">
                                Start Date:
                              </span>
                              {formatDate(startDate)}
                            </div>
                            <div>
                              <span className="mr-2 font-semibold">
                                End Date:
                              </span>
                              {formatDate(endDate)}
                            </div>
                            <div>
                              <span className="mr-2 font-semibold">Range:</span>
                              <input
                                type="number"
                                onChange={(e) => setRangeDays(e.target.value)}
                                value={rangeDays}
                                min={0}
                                disabled={
                                  isLoading || lockedField === "rangeDays"
                                }
                                className="w-8 mr-2 text-center"
                              ></input>
                              days
                            </div>
                          </div>
                        </div>

                        {/* <div className="flex flex-col mb-6 px-4 py-2 bg-disabled-100 rounded-xl text-ondisabled">
                          <div>
                            <span className="mr-2 font-semibold">
                              Start Date:
                            </span>
                            {formatDate(startDate)}
                          </div>
                          <div>
                            <span className="mr-2 font-semibold">End Date:</span>
                            {formatDate(endDate)}
                          </div>
                          <div>
                            <span className="mr-2 font-semibold">Range:</span>
                            <input
                              type="number"
                              onChange={(e) => setRangeDays(e.target.value)}
                              value={rangeDays}
                              min={0}
                              disabled={isLoading || lockedField === "rangeDays"}
                              className="w-12 mr-2"
                            ></input>
                            days
                          </div>
                        </div> */}

                        <div
                          className={`flex mb-4 px-4 py-2 ${
                            isRepeating
                              ? "bg-general-100 shadow-md"
                              : "bg-disabled-100 text-ondisabled"
                          } rounded-xl`}
                        >
                          <input
                            type="checkbox"
                            onChange={(e) => setIsRepeating(e.target.checked)}
                            className="inline-block mr-2"
                            checked={isRepeating}
                          ></input>
                          <div className="inline-block">
                            <FontAwesomeIcon
                              icon={faArrowsRotate}
                              className="mr-2"
                            ></FontAwesomeIcon>
                            <span className="mr-2 font-semibold">Repeat:</span>
                            <span className="mr-2">every</span>
                            <input
                              type="number"
                              value={repeatDays}
                              onChange={(e) =>
                                setRepeatDays(parseInt(e.target.value, 10))
                              }
                              min={1}
                              step={1}
                              className="w-8 mr-2 text-center"
                              disabled={isLoading || !isRepeating}
                            ></input>
                            <span>days</span>
                          </div>
                        </div>

                        <div
                          className={`flex mb-2 px-4 py-2 ${
                            hasTimeEstimate
                              ? "bg-general-100 shadow-md"
                              : "bg-disabled-100 text-ondisabled"
                          } rounded-xl`}
                        >
                          <input
                            type="checkbox"
                            onChange={(e) =>
                              setHasTimeEstimate(e.target.checked)
                            }
                            className="inline-block mr-2"
                            checked={hasTimeEstimate}
                          ></input>
                          <div className="inline-block">
                            <FontAwesomeIcon
                              icon={faHourglass}
                              className="mr-2"
                            ></FontAwesomeIcon>
                            <span className="mr-2 font-semibold">
                              Time Estimate:
                            </span>
                            <input
                              type="number"
                              onChange={(e) =>
                                setTimeEstimateMins(
                                  parseInt(e.target.value, 10)
                                )
                              }
                              value={timeEstimateMins}
                              min={0}
                              disabled={isLoading || !hasTimeEstimate}
                              className="w-8 mr-2 text-center"
                            ></input>
                            <span>minutes</span>
                          </div>
                        </div>
                        {/*
                        <div className="mb-4">
                          <p>
                            End date: {endDate.toString()}
                          </p>
                          <Calendar onChange={(d) => setEndDate(dayjs(d))} value={endDate.toDate()} disabled={isLoading || lockedField === 'endDate'} />
                        </div>
                        <div className="mb-4">
                          Range:&nbsp;
                          <input type="number" onChange={(e) => setRangeDays(e.target.value)} value={rangeDays} min={0} disabled={isLoading || lockedField === 'rangeDays'} className="w-12"></input> days
                        </div>
  */}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-10 py-3 flex flex-row justify-between">
                  <button
                    type="button"
                    className="inline-flex justify-center items-center rounded-full px-5 py-1 text-sm font-semibold shadow-md ring-1 ring-inset ring-general hover:bg-gray-50 mt-0 w-32 uppercase"
                    onClick={() => setIsOpen(false)}
                    ref={cancelButtonRef}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center items-center rounded-full px-5 py-1 text-sm font-semibold shadow-md ml-3 w-32 bg-accent text-ondark disabled:bg-disabled-200 uppercase"
                    onClick={isNewTask ? onAddButtonClick : onSaveButtonClick}
                    disabled={!isValid || isLoading}
                  >
                    {isNewTask ? "Add" : "Save"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
