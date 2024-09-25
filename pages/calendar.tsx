import type { TaskDto } from "@/types/task.dto";
import {
  taskDtoToViewModel,
  type TaskViewModel as Task,
} from "@/types/task.viewModel";
import { useState, useCallback, useEffect, useMemo } from "react";
import dayjs, { Dayjs } from "@/lib/dayjs";
import { OnArgs, TileContentFunc } from "react-calendar/dist/cjs/shared/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDownAZ,
  faCheck,
  faCirclePlus,
} from "@fortawesome/free-solid-svg-icons";
import { clone, uniqBy } from "lodash";
import {
  formatDayKey,
  formatPercentage,
  formatShownDate,
  formatTimeEstimate,
} from "@/util/format";
import {
  CalendarPicker,
  contentClassName,
  emptyDayTileContent,
} from "@/components/CalendarPicker";
import TaskCard from "@/components/TaskCard";
import { PulseLoader } from "react-spinners";
import { useModalContext } from "@/contexts/modal-context";
import { getTasksForDay, getTasksForDayRange } from "@/services/api.service";
import { useSettingsContext } from "@/contexts/settings-context";
import NavBar from "@/components/NavBar";
import {
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { Enumify } from "enumify";

const NUM_DAILY_WORKING_MINS = 4 * 60; // TODO make user-configurable

export default function CalendarView() {
  // TODO asc and desc - assume desc for now
  class SortMode extends Enumify {
    static StartDate = new SortMode();
    static EndDate = new SortMode();
    static RangeDays = new SortMode();
    static Elapsed = new SortMode();
    static _ = SortMode.closeEnum();
  }

  const { showAddEditModal } = useModalContext();
  const { monthInfoSettings, dayInfoSettings } = useSettingsContext();

  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);
  const [selectedDay, setSelectedDay] = useState<Dayjs>(dayjs());
  const [shownDateRange, setShownDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [isDayTasksLoading, setIsDayTasksLoading] = useState<boolean>(false);
  // `TaskDto` at the moment because we're only displaying this data in aggregate (sums and such)
  const [dayTasks, setDayTasks] = useState<Record<string, TaskDto[]>>({});
  const [selectedSort, setSelectedSort] = useState<SortMode>(
    SortMode.StartDate
  );

  console.log(">> testing enum equality 1:", SortMode.StartDate === SortMode.StartDate);
  console.log(">> testing enum equality 2:", selectedSort.enumKey, SortMode.StartDate.enumKey, selectedSort.enumKey === SortMode.StartDate.enumKey);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shownStartDay, shownEndDay] = shownDateRange;
        const dayTasks = await getTasksForDayRange(shownStartDay, shownEndDay);
        setDayTasks(dayTasks);
      } catch (maybeError) {
        console.error(maybeError);
        // TODO display some error message
      }
    };
    fetchData();
  }, [shownDateRange]);

  useEffect(
    () => {
      const fetchData = async () => {
        try {
          const newSelectedDayTasks = await getTasksForDay(selectedDay);
          setSelectedDayTasks(
            newSelectedDayTasks[formatDayKey(selectedDay)].map(
              taskDtoToViewModel
            )
          );
        } catch (maybeError) {
          console.error(maybeError);
          // TODO display some error message
        }
      };
      fetchData();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // only on first load
  );

  // TODO move to util module?
  const sortTasksByStartDate = (taskA: Task, taskB: Task): number =>
    taskA.startDate.isBefore(taskB.startDate) ? -1 : 1;
  const sortTasksByEndDate = (taskA: Task, taskB: Task): number => {
    console.log("task A", taskA);
    console.log("task B", taskB);
    return taskA.endDate.isBefore(taskB.endDate) ? -1 : 1;
  };
  const sortTasksByRange = (taskA: Task, taskB: Task): number =>
    taskA.rangeDays < taskB.rangeDays ? -1 : 1;
  const sortTasksByElapsed = (taskA: Task, taskB: Task): number =>
    taskA.rangeDays < taskB.rangeDays ? -1 : 1; // TODO
  const sortedSelectedDayTasks = useMemo(() => {
    console.log("about to sort by", selectedSort); // TODO remove

    // TODO enum equality here ain't working
    const sortingFunc = (() => {
      console.log("selected sort", selectedSort, "is StartDate:", selectedSort.enumKey === SortMode.StartDate.enumKey); // TODO remove
      switch (selectedSort.enumKey) {
        case SortMode.StartDate.enumKey:
          console.log("yep, it's StartDate");
          return sortTasksByStartDate;
        case SortMode.EndDate.enumKey:
          console.log("yep, it's EndDate");
          return sortTasksByEndDate;
        case SortMode.RangeDays.enumKey:
          return sortTasksByRange;
        case SortMode.Elapsed.enumKey:
          return sortTasksByElapsed;
        default:
          console.log("yep, it's none of these!");
      }
    })();
    console.log(selectedDayTasks);
    return clone(selectedDayTasks).sort(sortingFunc);
  }, [selectedDayTasks, selectedSort]);
  console.log("sortedSelectedDayTasks", sortedSelectedDayTasks);

  const handleSelectedDayChange = async (date: Date) => {
    try {
      setSelectedDay(dayjs(date));
      setIsDayTasksLoading(true);
      // if the date is "today", use the current time too
      const adjustedDate = dayjs(date).isSame(dayjs(), "day")
        ? dayjs()
        : dayjs(date);
      const dayTasks = await getTasksForDay(adjustedDate);
      const selectedDayTasks =
        dayTasks[formatDayKey(adjustedDate)].map(taskDtoToViewModel);
      setSelectedDayTasks(selectedDayTasks);
      setIsDayTasksLoading(false);
    } catch (maybeError: any) {
      console.error(maybeError);
      // TODO display some error message
    }
  };

  // Maybe this should be moved to `util/tasks`?
  // See `pages/api/tasks/index :: getTasksForDay` for similar logic
  // Will not take projected repeating tasks into consideration
  const shallTaskAppearOnDay = (
    task: Task,
    targetDay: Dayjs,
    currentDay: Dayjs
  ): boolean => {
    const targetDayIsAfterCurrentDay = targetDay.isAfter(currentDay, "day");
    if (!targetDayIsAfterCurrentDay) {
      return !task.startDate.isAfter(targetDay, "day");
    }
    return task.startDate.isSame(targetDay, "day");
  };

  const afterAddTask = (task: Task) => {
    const currentDay = dayjs();
    if (shallTaskAppearOnDay(task, selectedDay, currentDay)) {
      setSelectedDayTasks((tasks) => [...tasks, task]);
      return;
    }
    console.log("new task is after selected day; not adding it");
  };

  const handleAddButtonClick = () => {
    showAddEditModal(null, afterAddTask, { initialStartDate: selectedDay });
  };

  const afterCompleteTask = (task: Task, completeDay: Dayjs) => {
    if (completeDay.isSame(selectedDay, "day")) {
      setSelectedDayTasks((tasks) =>
        tasks.map((t) =>
          t.id === task.id ? { ...t, completedDate: completeDay } : t
        )
      );
    } else {
      setSelectedDayTasks((tasks) => tasks.filter((t) => t.id !== task.id));
    }
  };

  const afterEditTask = (task: Task) => {
    console.log("edited task id: ", task.id); // TODO remove
    const currentDay = dayjs();
    if (shallTaskAppearOnDay(task, selectedDay, currentDay)) {
      // update in list
      console.log(`updating in list:`, task); // TODO remove
      setSelectedDayTasks((tasks) =>
        tasks.map((t) => {
          if (t.id !== task.id) return t;
          return { ...task, id: task.id };
        })
      );
      return;
    }
    // else, remove it
    console.log(`removing ${task.title}`); // TODO remove
    setSelectedDayTasks((tasks) => tasks.filter((t) => t.id !== task.id));
  };

  const afterPostponeTask = async (task: Task) => {
    // TODO could use 2nd param `postponeDate` to update `dayTasks`?
    setSelectedDayTasks((tasks) => tasks.filter((t) => t.id !== task.id));
  };

  const afterDeleteTask = async (deletedTask: Task) => {
    setSelectedDayTasks((tasks) =>
      tasks.filter((t) => t.id !== deletedTask.id)
    );
  };

  const onActiveStartDateChange = ({ activeStartDate, view }: OnArgs): any => {
    if (view !== "month") return;
    const shownStartDate = dayjs(activeStartDate);
    setShownDateRange([shownStartDate, shownStartDate.endOf("month")]);
  };

  // TODO make this reuseable, see CalendarPicker.tsx
  const tileContent: TileContentFunc = ({ date, view }) => {
    const day = dayjs(date);
    const dayKey = formatDayKey(day);
    if (view !== "month") return null;
    const dayIsInPast = day.startOf("day").isBefore(dayjs().startOf("day"));
    if (!dayTasks?.[dayKey]) {
      return emptyDayTileContent;
    }
    const count = dayTasks[dayKey].length;
    return (
      <div
        className={`${contentClassName} flex justify-center items-end w-full`}
      >
        <div className={`text-xs text-ondark italic mr-0.5 relative -bottom-1`}>
          {count}
        </div>
      </div>
    );
  };

  const renderTaskCount = useCallback(
    (taskCount: number) => `${taskCount} task${taskCount !== 1 ? "s" : ""}`,
    []
  );

  const renderMonthInfo = useCallback(() => {
    if (!monthInfoSettings.isShowing) return null;
    const allTasks = uniqBy(
      Object.values(dayTasks).flat(),
      (task) => task.id && task.startDate
    );
    const totalTimeEstimateMins = allTasks.reduce(
      (total, task) => total + (task.timeEstimateMins || 0),
      0
    );
    const daysInRange = shownDateRange[1].diff(shownDateRange[0], "day");
    const dailyAverageTaskCount = Math.round(allTasks.length / daysInRange);
    const dailyAverageTimeTotal = Math.round(
      totalTimeEstimateMins / daysInRange
    );
    const monthItems = [
      ...(monthInfoSettings.monthTotalSection.isTaskCountShowing
        ? [`${allTasks.length} tasks`]
        : []),
      ...(monthInfoSettings.monthTotalSection.isTimeEstimateShowing
        ? [formatTimeEstimate(totalTimeEstimateMins)]
        : []),
    ];
    const dailyAverageItems = [
      ...(monthInfoSettings.dailyAverageSection.isTaskCountShowing
        ? [`${dailyAverageTaskCount} tasks`]
        : []),
      ...(monthInfoSettings.dailyAverageSection.isTimeEstimateShowing
        ? [formatTimeEstimate(dailyAverageTimeTotal)]
        : []),
      ...(monthInfoSettings.dailyAverageSection.isTimePercentageShowing
        ? [formatPercentage(dailyAverageTimeTotal / NUM_DAILY_WORKING_MINS)]
        : []),
    ];
    return (
      <div className="flex flex-col items-center text-xs font-light">
        <div className="font-semibold bg-general-100 rounded-full w-fit px-3">
          Month:
        </div>
        <table className="table-auto">
          <tbody>
            {monthItems.length > 0 && (
              <tr>
                <td className="text-right font-semibold">Total:</td>
                <td>{monthItems.join("/")}</td>
              </tr>
            )}
            {dailyAverageItems.length > 0 && (
              <tr>
                <td className="text-right font-semibold">Daily avg:</td>
                <td>{dailyAverageItems.join("/")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }, [dayTasks, shownDateRange, monthInfoSettings]);

  const renderDayInfo = useCallback(
    (tasks: Task[]) => {
      if (!dayInfoSettings.isShowing) return null;

      const completedTasks = tasks.filter((task) => task.completedDate);
      const remainingTasks = tasks.filter((task) => !task.completedDate);
      const completedTimeMins = completedTasks.reduce(
        (total, task) => total + (task.timeEstimateMins || 0),
        0
      );
      const remainingTimeMins = remainingTasks.reduce(
        (total, task) => total + (task.timeEstimateMins || 0),
        0
      );
      const remainingItems = [
        ...(dayInfoSettings.remainingTaskSection.isTaskCountShowing
          ? [renderTaskCount(remainingTasks.length)]
          : []),
        ...(dayInfoSettings.remainingTaskSection.isTimeEstimateShowing
          ? [formatTimeEstimate(remainingTimeMins)]
          : []),
        ...(dayInfoSettings.remainingTaskSection.isTimePercentageShowing
          ? [formatPercentage(remainingTimeMins / NUM_DAILY_WORKING_MINS)]
          : []),
      ];
      const completedItems = completedTasks.length
        ? [
            ...(dayInfoSettings.completedTaskSection.isTaskCountShowing
              ? [renderTaskCount(completedTasks.length)]
              : []),
            ...(dayInfoSettings.completedTaskSection.isTimeEstimateShowing
              ? [formatTimeEstimate(completedTimeMins)]
              : []),
            ...(dayInfoSettings.completedTaskSection.isTimePercentageShowing
              ? [formatPercentage(completedTimeMins / NUM_DAILY_WORKING_MINS)]
              : []),
          ]
        : [];

      return (
        <div className="flex flex-col items-center text-xs font-light">
          <div className="font-semibold bg-general-100 rounded-full w-fit px-3">
            Day:
          </div>
          <table className="table-auto">
            <tbody>
              {remainingItems.length > 0 && (
                <tr>
                  <td className="text-right font-semibold">To Do:</td>
                  <td>{remainingItems.join("/")}</td>
                </tr>
              )}
              {completedItems.length > 0 && (
                <tr>
                  <td className="text-right font-semibold">Done:</td>
                  <td>{completedItems.join("/")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    },
    [dayInfoSettings, renderTaskCount]
  );

  const renderSortOptions = () => {
    return (
      <Listbox value={selectedSort} onChange={setSelectedSort}>
        <Label className="block text-sm">Sort</Label>

        <div className="relative">
          <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
            <span className="flex items-center">
              {/* <img alt="" src={selected.avatar} className="h-5 w-5 flex-shrink-0 rounded-full" /> */}
              <span className="ml-3 block truncate">
                {selectedSort.enumKey}
              </span>
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
              {/* <ChevronUpDownIcon aria-hidden="true" className="h-5 w-5 text-gray-400" /> */}
              <FontAwesomeIcon icon={faArrowDownAZ} />
            </span>
          </ListboxButton>

          <ListboxOptions
            transition
            className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in sm:text-sm"
          >
            {SortMode.enumValues.map((sortMode) => (
              <ListboxOption
                key={sortMode.enumKey}
                value={sortMode}
                className="group relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white"
              >
                <div className="flex items-center">
                  {/* <img
                    alt=""
                    src={person.avatar}
                    className="h-5 w-5 flex-shrink-0 rounded-full"
                  /> */}
                  <span className="ml-3 block truncate font-normal group-data-[selected]:font-semibold">
                    {sortMode.enumKey}
                  </span>
                </div>

                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 group-data-[focus]:text-white [.group:not([data-selected])_&]:hidden">
                  {/* <CheckIcon aria-hidden="true" className="h-5 w-5" /> */}
                  <FontAwesomeIcon icon={faCheck} />
                </span>
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    );
  };

  return (
    <div className="max-h-full overflow-auto">
      <NavBar />

      <section className={`flex flex-col items-center pr-8 pl-8 mb-6`}>
        <h1 className="mb-1 mt-10 text-4xl font-bold">
          {formatShownDate(selectedDay)}
        </h1>
        <CalendarPicker
          onChange={(d) => handleSelectedDayChange(d as Date)}
          value={selectedDay.toDate()}
          onActiveStartDateChange={onActiveStartDateChange}
          tileContent={tileContent}
        />
      </section>

      <section className="mx-auto max-w-lg">
        <div className="flex flex-row justify-evenly mb-6">
          <div className="">{renderMonthInfo()}</div>
          <div className="">{renderDayInfo(selectedDayTasks)}</div>
        </div>
      </section>

      <section
        className={`flex min-h-screen flex-col items-center pl-8 pr-8 gap-y-4`}
      >
        <div>{renderSortOptions()}</div>

        <div
          onClick={handleAddButtonClick}
          className="max-w-lg w-full px-2 py-1 rounded-xl border-2 border-general-200 hover:bg-gray-200 hover:cursor-pointer text-general-200"
        >
          <FontAwesomeIcon icon={faCirclePlus} className="ml-0.5 mr-3" />
          <span>Add task</span>
        </div>

        {isDayTasksLoading ? (
          // TODO take tailwind classes instead
          <PulseLoader color="#d5dedb" className="mt-4" />
        ) : (
          sortedSelectedDayTasks?.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              selectedDay={selectedDay}
              afterComplete={afterCompleteTask}
              afterEdit={afterEditTask}
              afterPostpone={afterPostponeTask}
              afterDelete={afterDeleteTask}
            />
          ))
        )}

        <div id="placeholder" className="h-[50vh]"></div>
      </section>
    </div>
  );
}
