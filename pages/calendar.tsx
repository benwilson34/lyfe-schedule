import type { TaskDto } from "@/types/task.dto";
import {
  taskDtoToViewModel,
  type TaskViewModel as Task,
} from "@/types/task.viewModel";
import { useState, useCallback, useEffect, useMemo } from "react";
import dayjs, { Dayjs } from "@/lib/dayjs";
import { OnArgs, TileContentFunc } from "react-calendar/dist/cjs/shared/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
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
  calculatePriority,
  sortTasksByEndDate,
  sortTasksByRange,
  sortTasksByRepeatInterval,
  sortTasksByStartDate,
  sortTasksByTimeEstimate,
} from "@/util/task";
import { SortMode } from "@/util/enums";
import SortControls from "@/components/SortControls";
import { IS_DEMO_MODE } from "@/util/env";
import { GetServerSideProps } from "next/types";

const NUM_DAILY_WORKING_MINS = 4 * 60; // TODO make user-configurable

export const getServerSideProps = (async (context: any) => {
  return {
    props: {
      isDemoMode: IS_DEMO_MODE,
    },
  };
}) satisfies GetServerSideProps;

export default function CalendarView() {
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
  const [areCompletedTasksSortedFirst, setAreCompletedTasksSortedFirst] =
    useState<boolean>(true);
  const [selectedSort, setSelectedSort] = useState<SortMode>(SortMode.Priority);
  const [isSortAscending, setIsSortAscending] = useState<boolean>(false);

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

  const sortTasksByPriority = useCallback(
    (taskA: Task, taskB: Task): number =>
      calculatePriority(taskA.startDate, taskA.endDate, selectedDay) <
      calculatePriority(taskB.startDate, taskB.endDate, selectedDay)
        ? -1
        : 1,
    [selectedDay]
  );

  const sortedSelectedDayTasks = useMemo(() => {
    const selectedSortingFunc = (() => {
      switch (selectedSort) {
        default:
        case SortMode.Priority:
          return sortTasksByPriority;
        case SortMode.StartDate:
          return sortTasksByStartDate;
        case SortMode.EndDate:
          return sortTasksByEndDate;
        case SortMode.RangeDays:
          return sortTasksByRange;
        case SortMode.TimeEstimate:
          return sortTasksByTimeEstimate;
        case SortMode.RepeatInterval:
          return sortTasksByRepeatInterval;
      }
    })();
    const sortDirection = isSortAscending ? 1 : -1;
    let sortingFunc = (taskA: Task, taskB: Task): number =>
      selectedSortingFunc(taskA, taskB) * sortDirection;
    // TODO use areCompletedTasksSortedFirst
    if (areCompletedTasksSortedFirst) {
      sortingFunc = (taskA: Task, taskB: Task): number => {
        if (!!taskA.completedDate !== !!taskB.completedDate) {
          return taskA.completedDate ? 1 : -1;
        }
        return selectedSortingFunc(taskA, taskB) * sortDirection;
      };
    }
    const sortedTasks = clone(selectedDayTasks).sort(sortingFunc);
    return sortedTasks;
  }, [
    isSortAscending,
    areCompletedTasksSortedFirst,
    selectedDayTasks,
    selectedSort,
    sortTasksByPriority,
  ]);

  const toggleCompletedTasksSortedFirst = () =>
    setAreCompletedTasksSortedFirst(!areCompletedTasksSortedFirst);

  const toggleSortDirection = () => setIsSortAscending(!isSortAscending);

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

  const afterPostponeTask = (task: Task) => {
    // TODO could use 2nd param `postponeDate` to update `dayTasks`?
    setSelectedDayTasks((tasks) => tasks.filter((t) => t.id !== task.id));
  };

  const afterDeleteTask = (deletedTask: Task) => {
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
        <div className={`text-xs italic mr-0.5 relative -bottom-1`}>
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
        className={`flex min-h-screen flex-col items-center pl-8 pr-8 gap-y-6`}
      >
        <div className="flex max-w-lg w-full items-center justify-between">
          <div>
            <SortControls
              selectedSort={selectedSort}
              setSelectedSort={setSelectedSort}
              isSortAscending={isSortAscending}
              toggleSortDirection={toggleSortDirection}
              areCompletedTasksSortedFirst={areCompletedTasksSortedFirst}
              toggleAreCompletedTasksSortedFirst={
                toggleCompletedTasksSortedFirst
              }
            />
          </div>

          <div />
        </div>

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
              afterReschedule={afterEditTask}
              afterDelete={afterDeleteTask}
            />
          ))
        )}

        <div id="placeholder" className="h-[50vh]"></div>
      </section>
    </div>
  );
}
