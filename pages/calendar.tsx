import type { TaskDto } from "@/types/task.dto";
import type { TaskViewModel as Task } from "@/types/task.viewModel";
import { useState, useCallback, useEffect } from "react";
import { getToken } from "next-auth/jwt";
import dayjs, { Dayjs } from "dayjs";
import { OnArgs, TileContentFunc } from "react-calendar/dist/cjs/shared/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faArrowLeft,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import { getTasksForDay as getTasksForDayFromDb } from "./api/tasks";
import { taskDaoToDto } from "@/types/task.dao";
import { uniqBy } from "lodash";
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
import { GetServerSideProps } from "next";
import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { useSidebarContext } from "@/contexts/sidebar-context";
import { useModalContext } from "@/contexts/modal-context";
import {
  completeTask,
  deleteTask,
  getTasksForDay,
  getTasksForDayRange,
  postponeTask,
} from "@/services/api.service";

const NUM_DAILY_WORKING_MINS = 4 * 60; // TODO make user-configurable

function dtoTaskToTask(taskDto: TaskDto): Task {
  return {
    ...taskDto,
    startDate: dayjs(taskDto.startDate),
    endDate: dayjs(taskDto.endDate),
    ...(taskDto.completedDate && {
      completedDate: dayjs(taskDto.completedDate),
    }),
  } as Task;
}

export const getServerSideProps = (async (context: any) => {
  // TODO this would be better as a util function
  // auth
  const token = await getToken({ req: context.req });
  if (!token) {
    // shouldn't be possible to get to this point
    console.error(`Error initializing: authentication error!`);
    return { props: {} };
  }
  const userId = token.sub!;

  const today = new Date();
  const initTasks: TaskDto[] = (await getTasksForDayFromDb(userId, today)).map(
    taskDaoToDto
  );
  return {
    props: {
      initTasks,
    },
  };
}) satisfies GetServerSideProps;

export default function CalendarView({ initTasks }: { initTasks: TaskDto[] }) {
  const { isVisible: isSidebarVisible, setIsVisible: setIsSidebarVisible } =
    useSidebarContext();
  const {
    showAddEditModal,
    showPostponeToModal,
    showCompleteOnAnotherDayModal,
    showDeleteModal,
  } = useModalContext();

  const [selectedDayTasks, setSelectedDayTasks] = useState(
    initTasks.map(dtoTaskToTask) as Task[]
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDay, setSelectedDay] = useState<Dayjs>(dayjs());
  const [shownDateRange, setShownDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [isDayTasksLoading, setIsDayTasksLoading] = useState(false);
  const [dayTasks, setDayTasks] = useState<Record<string, TaskDto[]>>({});

  const DEFAULT_MONTH_INFO_SETTINGS = {
    isShowing: true,
    monthTotalSection: {
      isTaskCountShowing: true,
      isTimeEstimateShowing: true,
    },
    dailyAverageSection: {
      isTaskCountShowing: true,
      isTimeEstimateShowing: true,
      isTimePercentageShowing: true,
    },
  };
  // user-configurable settings
  const [monthInfoSettings, setMonthInfoSettings] = useState(
    DEFAULT_MONTH_INFO_SETTINGS
  );
  const DEFAULT_DAY_INFO_SETTINGS = {
    isShowing: true,
    dayTotalSection: {
      // TODO total regardless of completed or not
    },
    remainingTaskSection: {
      isTaskCountShowing: true,
      isTimeEstimateShowing: true,
      isTimePercentageShowing: true,
    },
    completedTaskSection: {
      isTaskCountShowing: true,
      isTimeEstimateShowing: true,
      isTimePercentageShowing: true,
    },
  };
  const [dayInfoSettings, setDayInfoSettings] = useState(
    DEFAULT_DAY_INFO_SETTINGS
  );

  useEffect(() => {
    const savedSettings = JSON.parse(
      localStorage.getItem("settings") || "null"
    );
    if (savedSettings) {
      setMonthInfoSettings(savedSettings.monthInfoSettings);
      setDayInfoSettings(savedSettings.dayInfoSettings);
    }
  }, []); // only read from localStorage on first load

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

  const handleSelectedDayChange = async (date: Date) => {
    try {
      setSelectedDay(dayjs(date));
      setIsDayTasksLoading(true);
      const dayTasks = await getTasksForDay(dayjs(date));
      const newTasks =
        dayTasks[dayjs(date).format("YYYY-MM-DD")].map(dtoTaskToTask);
      setSelectedDayTasks(newTasks);
      setIsDayTasksLoading(false);
    } catch (maybeError: any) {
      console.error(maybeError);
      // TODO display some error message
    }
  };

  const completeTaskOnAnotherDay = useCallback(
    async (completedDate: Date) => {
      // TODO animate
      const selectedId = selectedTask!.id;
      const newTasks = selectedDayTasks.filter(
        (task) => task.id !== selectedId
      );
      setSelectedDayTasks(newTasks);
      await completeTask(selectedId, completedDate);
    },
    [selectedTask, selectedDayTasks, setSelectedDayTasks]
  );

  const handleCompleteTaskOnAnotherDayOption = async (task: Task) => {
    setSelectedTask(task);
    showCompleteOnAnotherDayModal(task, completeTaskOnAnotherDay);
  };

  const handleCompleteTaskToday = async (completedTaskId: string) => {
    // TODO animate
    // accurate completedDate isn't really necessary here
    const newTasks = selectedDayTasks.map((task) =>
      task.id === completedTaskId ? { ...task, completedDate: dayjs() } : task
    );
    setSelectedDayTasks(newTasks);
    await completeTask(completedTaskId);
  };

  const handleCompletedAddEdit = (task: Task, isAdding: boolean) => {
    if (isAdding) {
      setSelectedDayTasks((tasks) => [...tasks, task]);
    } else {
      setSelectedDayTasks((tasks) =>
        tasks.map((t) => {
          if (t.id !== task.id) return t;
          return { ...task, id: task.id };
        })
      );
    }
  };

  const handleAddButtonClick = () => {
    showAddEditModal(null, handleCompletedAddEdit, selectedDay);
  };

  const handleEditOption = (task: Task) => {
    showAddEditModal(task, handleCompletedAddEdit, selectedDay);
  };

  const handlePostponeTaskOption = async (task: Task, postponeDay: Dayjs) => {
    try {
      await postponeTask(task.id, postponeDay);
      // TODO update state and/or re-fetch task data
      setSelectedDayTasks((tasks) => tasks.filter((t) => t.id !== task.id));
    } catch (maybeError: any) {
      // TODO display some error message
      console.error(maybeError);
    }
  };

  const handleConfirmedPostponeTask = useCallback(
    async (postponeUntilDate: Date) => {
      try {
        // TODO animate
        const selectedId = selectedTask!.id;
        setSelectedDayTasks((tasks) =>
          tasks.filter((t) => t.id !== selectedId)
        );
        await postponeTask(selectedTask!.id, dayjs(postponeUntilDate));
      } catch (maybeError: any) {
        // TODO display some error message
        console.error(maybeError);
      }
    },
    [selectedTask, setSelectedDayTasks]
  );

  const handlePostponeTaskToAnotherDayOption = async (task: Task) => {
    setSelectedTask(task); // TODO needed?
    showPostponeToModal(task, handleConfirmedPostponeTask);
  };

  const handleDeleteTaskOption = async (task: Task) => {
    setSelectedTask(task); // TODO needed?
    showDeleteModal(task, handleConfirmedDelete);
  };

  const handleConfirmedDelete = useCallback(async () => {
    if (!selectedTask) return;
    try {
      await deleteTask(selectedTask.id);
      setSelectedDayTasks((tasks) =>
        tasks.filter((t) => t.id !== selectedTask.id)
      );
    } catch (maybeError) {
      console.error(maybeError);
      // TODO show some error message
    }
  }, [selectedTask]);

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
        <div
          className={`${
            dayIsInPast ? "text-general-200" : "text-general"
          } text-2xs italic mr-0.5 relative -bottom-0.5`}
        >
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
      if (tasks.length === 0) return `0 tasks 😌`;

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

  const toggleSidebar = useCallback(
    () => setIsSidebarVisible(!isSidebarVisible),
    [isSidebarVisible, setIsSidebarVisible]
  );

  return (
    <div className="max-h-full overflow-auto">
      <section className="sticky flex justify-between top-2 pl-2 pr-2">
        <FontAwesomeIcon
          icon={isSidebarVisible ? faArrowLeft : faBars}
          className="cursor-pointer hover:bg-gray-500/25"
          onClick={toggleSidebar}
        ></FontAwesomeIcon>
        <a
          href="https://docs.lyfeschedule.com/getting-started.html"
          target="_blank"
        >
          <FontAwesomeIcon
            icon={faCircleQuestion}
            className="cursor-pointer hover:bg-gray-500/25"
          ></FontAwesomeIcon>
        </a>
      </section>

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

      <section>
        <div className="flex flex-row justify-evenly mb-6">
          <div className="w-1/2">{renderMonthInfo()}</div>
          <div className="w-1/2">{renderDayInfo(selectedDayTasks)}</div>
        </div>
      </section>

      <section className={`flex min-h-screen flex-col items-center pl-8 pr-8`}>
        <div
          onClick={handleAddButtonClick}
          className="max-w-lg w-full mb-2 px-2 py-1 rounded-xl border-2 border-general-200 hover:bg-gray-200 hover:cursor-pointer text-general-200"
        >
          <FontAwesomeIcon icon={faCirclePlus} className="ml-0.5 mr-3" />
          <span>Add task</span>
        </div>
        {isDayTasksLoading ? (
          // TODO take tailwind classes instead
          <PulseLoader color="#d5dedb" className="mt-4" />
        ) : (
          selectedDayTasks?.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              selectedDay={selectedDay}
              onCheckboxClick={handleCompleteTaskToday}
              onCompleteOnAnotherDay={handleCompleteTaskOnAnotherDayOption}
              onEdit={handleEditOption}
              onPostpone={handlePostponeTaskOption}
              onPostponeToAnotherDay={handlePostponeTaskToAnotherDayOption}
              onDelete={handleDeleteTaskOption}
            />
          ))
        )}

        <div id="placeholder" className="h-[50vh]"></div>
      </section>
    </div>
  );
}
