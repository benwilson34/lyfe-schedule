/**
 * @see https://tailwindui.com/components/application-ui/overlays/modals
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
import dayjs, { Dayjs } from "@/lib/dayjs";
import { calculateRangeDays } from "@/util/task";
import {
  CalendarPicker,
  contentClassName,
  emptyDayTileContent,
} from "./CalendarPicker";
// import './editTaskModal.css';
import { Exo_2 } from "next/font/google";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { faCalendar, faClock } from "@fortawesome/free-regular-svg-icons";
import { TaskViewModel as Task } from "@/types/task.viewModel";
import { OnClickFunc, TileContentFunc } from "react-calendar";
import { createTask, patchTask } from "@/services/api.service";
import { CreateTaskDto, PatchTaskDto } from "@/types/task.dto";
import { getCanonicalDatestring } from "@/util/date";
import { isEqual } from "lodash";

// TODO why is this needed even though the font is included in `_app`?
const exo2 = Exo_2({ subsets: ["latin"] });

const Bound = {
  START: "start",
  END: "end",
};

export function AddEditTaskModal({
  isOpen,
  handleClose,
  task,
  afterSave,
  initialStartDate,
  initialTags,
}: {
  isOpen: boolean;
  handleClose: () => void;
  task: Task;
  afterSave: (task: Task) => void;
  initialStartDate: Dayjs | null;
  initialTags: string[] | null;
}) {
  const [title, setTitle] = useState(task?.title || "");
  const [inputTags, setInputTags] = useState((task?.tags || initialTags)?.join(" ") || "");
  // TODO handle `useStartTime === true`
  const [startDate, setStartDate] = useState(
    task?.startDate || initialStartDate || dayjs()
  );
  // TODO handle `useEndTime === true`
  const [endDate, setEndDate] = useState(
    task?.endDate || initialStartDate || dayjs()
  );
  const [rangeDays, setRangeDays] = useState(task ? task.rangeDays : 1);
  const [hasRepeatDays, setHasRepeatDays] = useState(
    task ? !!task.repeatDays : false
  );
  const [repeatDays, setRepeatDays] = useState(task?.repeatDays || 1);
  const [hasTimeEstimate, setHasTimeEstimate] = useState(
    task ? !!task.timeEstimateMins : true
  );
  const [timeEstimateMins, setTimeEstimateMins] = useState(
    task?.timeEstimateMins || 15
  );
  const [isLoading, setIsLoading] = useState(false);
  const [mostRecentlySetDate, setMostRecentlySetDate] = useState(Bound.END);
  // type DateField = 'startDate' | 'endDate' | 'rangeDays';
  const [lockedField, setLockedField] = useState("rangeDays");

  const isNewTask = useMemo(() => !task, [task]);
  // repeatDays patch cases:
  // if not task.repeatDays and not isRepeating, no action.
  // if not task.repeatDays and isRepeating, update.
  // if task.repeatDays and isRepeating and equal to input repeatDays, no action.
  // if task.repeatDays and isRepeating and not equal to input repeatDays, update.
  // if task.repeatDays and not isRepeating, remove.
  const repeatDaysNeedsRemove = useMemo(
    () => !isNewTask && !!(task.repeatDays && !hasRepeatDays),
    [isNewTask, task, hasRepeatDays]
  );
  const repeatDaysNeedsUpdate = useMemo(
    () =>
      !isNewTask &&
      !!(
        (!task.repeatDays && hasRepeatDays) ||
        (task.repeatDays && hasRepeatDays && task.repeatDays !== repeatDays)
      ),
    [isNewTask, task, hasRepeatDays, repeatDays]
  );
  // timeEstimate has same patch cases as above
  const timeEstimateNeedsRemove = useMemo(
    () => !isNewTask && !!(task.timeEstimateMins && !hasTimeEstimate),
    [isNewTask, task, hasTimeEstimate]
  );
  const timeEstimateNeedsUpdate = useMemo(
    () =>
      !isNewTask &&
      !!(
        (!task.timeEstimateMins && hasTimeEstimate) ||
        (task.timeEstimateMins &&
          hasTimeEstimate &&
          task.timeEstimateMins !== timeEstimateMins)
      ),
    [isNewTask, task, hasTimeEstimate, timeEstimateMins]
  );

  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (lockedField === "rangeDays") {
      setRangeDays(calculateRangeDays(startDate, endDate));
      return;
    }
    // TODO calculate other locked fields startDate and endDate
    throw new Error("Not implemented yet");
  }, [lockedField, startDate, endDate]);

  const getTagsFromInputTags = (inputTags: string): string[] => {
    return inputTags
      .split(/\s/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0);
  };

  const hasChangedFields = useMemo<boolean>(() => {
    // early-exit for performance, return value doesn't matter
    if (isNewTask) {
      return false;
    }
    const parsedInputTags = getTagsFromInputTags(inputTags);
    return (
      title !== task.title ||
      !isEqual(parsedInputTags, task.tags) ||
      !startDate.isSame(task.startDate, "day") ||
      !endDate.isSame(task.endDate, "day") ||
      rangeDays !== task.rangeDays ||
      repeatDaysNeedsRemove ||
      repeatDaysNeedsUpdate ||
      timeEstimateNeedsRemove ||
      timeEstimateNeedsUpdate
    );
  }, [
    isNewTask,
    task,
    title,
    inputTags,
    startDate,
    endDate,
    rangeDays,
    repeatDaysNeedsRemove,
    repeatDaysNeedsUpdate,
    timeEstimateNeedsRemove,
    timeEstimateNeedsUpdate,
  ]);

  const isValid = useMemo(() => {
    // TODO validate new task
    const isValidTitle = typeof title === "string" && title.trim().length > 0;
    if (isNewTask) {
      return isValidTitle;
    }
    // else, editing a task
    return isValidTitle && hasChangedFields;
  }, [title, isNewTask, hasChangedFields]);

  const handleClickDay = useCallback<OnClickFunc>(
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
        setEndDate(startDate);
        setStartDate(chosenDate);
      } else {
        setEndDate(chosenDate);
      }
      setMostRecentlySetDate(Bound.END);
    },
    [mostRecentlySetDate, startDate]
  );

  const tileContent = useCallback<TileContentFunc>(
    ({ date, view }) => {
      if (view !== "month") return null;
      if (!hasRepeatDays) return emptyDayTileContent;
      const startOfDate = dayjs(date).startOf("day");
      if (startOfDate < dayjs().startOf("day") || startOfDate < startDate) {
        return emptyDayTileContent;
      }
      const daysFromStartDate = dayjs(date).diff(startDate, "days");
      if (daysFromStartDate !== 0 && daysFromStartDate % repeatDays === 0) {
        return (
          <div
            className={`${contentClassName} flex justify-center items-end w-full`}
          >
            <span className="text-base leading-none">
              <FontAwesomeIcon icon={faArrowsRotate}></FontAwesomeIcon>
            </span>
          </div>
        );
      }
      return emptyDayTileContent;
    },
    [hasRepeatDays, startDate, repeatDays]
  );

  const onAddButtonClick = useCallback(async () => {
    try {
      const taskToAdd: Partial<Task> = {
        title: title!,
        ...(inputTags.length > 0 && { tags: getTagsFromInputTags(inputTags) }),
        startDate: dayjs(startDate),
        endDate: dayjs(endDate),
        rangeDays: rangeDays!,
        ...(hasRepeatDays && { repeatDays }),
        ...(hasTimeEstimate && { timeEstimateMins }),
      };

      setIsLoading(true);

      const taskId = await createTask({
        ...taskToAdd,
        startDate: getCanonicalDatestring(startDate),
        endDate: getCanonicalDatestring(endDate),
      } as CreateTaskDto);
      taskToAdd.id = taskId;

      afterSave(taskToAdd as Task);
      handleClose();
      // TODO show some confimation message
    } catch (error) {
      console.error(error);
      // TODO show some error message
    } finally {
      setIsLoading(false);
    }
  }, [
    title,
    inputTags,
    startDate,
    endDate,
    rangeDays,
    hasRepeatDays,
    repeatDays,
    hasTimeEstimate,
    timeEstimateMins,
    handleClose,
    afterSave,
  ]);

  const onSaveButtonClick = useCallback(async () => {
    try {
      // create patch object
      const parsedInputTags = getTagsFromInputTags(inputTags);

      const taskToPatch: PatchTaskDto = {
        ...(title !== task.title && { title: { op: "update", value: title } }),
        ...(!isEqual(parsedInputTags, task.tags) && {
          tags: {
            op: parsedInputTags.length === 0 ? "remove" : "update",
            value: parsedInputTags,
          },
        }),
        ...(!startDate.isSame(task.startDate, "day") && {
          startDate: { op: "update", value: getCanonicalDatestring(startDate) }, //dayjs?
        }),
        ...(!endDate.isSame(task.endDate, "day") && {
          endDate: { op: "update", value: getCanonicalDatestring(endDate) },
        }),
        ...(rangeDays !== task.rangeDays && {
          rangeDays: { op: "update", value: rangeDays },
        }),
        ...((repeatDaysNeedsRemove || repeatDaysNeedsUpdate) && {
          repeatDays: {
            op: repeatDaysNeedsRemove ? "remove" : "update",
            value: repeatDays,
          },
        }),
        ...((timeEstimateNeedsRemove || timeEstimateNeedsUpdate) && {
          timeEstimateMins: {
            op: timeEstimateNeedsRemove ? "remove" : "update",
            value: timeEstimateMins,
          },
        }),
      };

      setIsLoading(true);

      await patchTask(task.id, taskToPatch);

      const savedTask = {
        ...task,
        title,
        tags: inputTags.length > 0 ? parsedInputTags : undefined,
        startDate: dayjs(startDate),
        endDate: dayjs(endDate),
        rangeDays: rangeDays!,
        repeatDays: hasRepeatDays ? repeatDays : undefined,
        timeEstimateMins: hasTimeEstimate ? timeEstimateMins : undefined,
      } as Task;

      afterSave(savedTask);
      handleClose();
      // TODO show some confimation message
    } catch (error) {
      console.error(error);
      // TODO show some error message
    } finally {
      setIsLoading(false);
    }
  }, [
    title,
    inputTags,
    startDate,
    endDate,
    rangeDays,
    hasRepeatDays,
    repeatDays,
    repeatDaysNeedsRemove,
    repeatDaysNeedsUpdate,
    hasTimeEstimate,
    timeEstimateMins,
    timeEstimateNeedsRemove,
    timeEstimateNeedsUpdate,
    task,
    afterSave,
    handleClose,
  ]);

  const formatDate = useCallback(
    (date: Dayjs) => date.format("ddd MMM D, YYYY"),
    []
  );

  if (!isOpen) {
    return null;
  }

  const renderModalBody = () => (
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
              <div className="flex w-full max-w-full mb-4 px-4 py-2 bg-general-100 rounded-xl">
                <span className="mr-2 font-semibold">
                  Title<span className="text-onattention">*</span>:
                </span>

                <input
                  className="flex-grow min-w-0 bg-transparent border-b-[1px] border-general"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                ></input>
              </div>

              <div className="flex w-full max-w-full mb-4 px-4 py-2 bg-general-100 rounded-xl">
                <span className="mr-2 font-semibold">Tags:</span>

                <input
                  className="flex-grow min-w-0 bg-transparent border-b-[1px] border-general"
                  type="text"
                  value={inputTags}
                  onChange={(e) => setInputTags(e.target.value)}
                ></input>
              </div>

              <div className="mb-4 ring-2 ring-general-200 rounded-lg p-2">
                <div className="font-semibold">
                  <FontAwesomeIcon
                    icon={faCalendar}
                    className="mr-1"
                  ></FontAwesomeIcon>
                  Schedule:
                </div>

                <div className="text-sm text-general-200 leading-none italic">
                  {/* TODO this would be better as a tooltip */}
                  Click once to choose a single day. Click again to choose a
                  range.
                </div>

                <CalendarPicker
                  value={[
                    startDate.startOf("day").toDate(),
                    endDate.endOf("day").toDate(),
                  ]}
                  onClickDay={handleClickDay}
                  tileContent={tileContent}
                  // disabled={isLoading}
                  className="mx-auto mb-4"
                />

                <div className="flex flex-col px-4 py-2 bg-disabled-100 rounded-xl text-ondisabled">
                  <div>
                    <span className="mr-2 font-semibold">Start Date:</span>

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
                      onChange={(e) =>
                        setRangeDays(parseInt(e.target.value, 10))
                      }
                      value={rangeDays}
                      min={0}
                      disabled={isLoading || lockedField === "rangeDays"}
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
                className={`flex items-center mb-4 px-4 py-2 ${
                  hasRepeatDays
                    ? "bg-general-100"
                    : "bg-disabled-100 text-ondisabled"
                } rounded-xl`}
              >
                <input
                  type="checkbox"
                  onChange={(e) => setHasRepeatDays(e.target.checked)}
                  className="inline-block mr-2"
                  checked={hasRepeatDays}
                ></input>

                <div className="inline-block">
                  <FontAwesomeIcon
                    icon={faArrowsRotate}
                    className="mr-1"
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
                    disabled={isLoading || !hasRepeatDays}
                  ></input>

                  <span>days</span>
                </div>
              </div>

              <div
                className={`flex items-center mb-2 px-4 py-2 ${
                  hasTimeEstimate
                    ? "bg-general-100"
                    : "bg-disabled-100 text-ondisabled"
                } rounded-xl`}
              >
                <input
                  type="checkbox"
                  onChange={(e) => setHasTimeEstimate(e.target.checked)}
                  className="inline-block mr-2"
                  checked={hasTimeEstimate}
                ></input>
                <div className="inline-block">
                  <FontAwesomeIcon
                    icon={faClock}
                    className="mr-1"
                  ></FontAwesomeIcon>

                  <span className="mr-2 font-semibold">Time Estimate:</span>

                  <input
                    type="number"
                    onChange={(e) =>
                      setTimeEstimateMins(parseInt(e.target.value, 10))
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
          onClick={() => handleClose()}
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
          {isLoading && (
            <div className="loader border-r-ondark border-b-ondark mr-3 w-4 h-4 relative" />
          )}
          {isNewTask ? "Add" : "Save"}
        </button>
      </div>
    </Dialog.Panel>
  );

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className={`${exo2.className} relative z-30`}
        initialFocus={cancelButtonRef}
        onClose={handleClose}
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
              {renderModalBody()}
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
