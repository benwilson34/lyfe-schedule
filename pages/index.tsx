import type { TaskDto } from "@/types/task.dto";
import type { TaskViewModel as Task } from "@/types/task.viewModel";
import { useState, useCallback, useEffect } from "react";
import { getToken } from "next-auth/jwt";
import dayjs, { Dayjs } from "dayjs";
import { OnArgs, TileContentFunc } from "react-calendar/dist/cjs/shared/types";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faArrowRight,
  faArrowLeft,
  faCalendarDays,
  faList,
  faTags,
  faArrowRightFromBracket,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
import { EditTaskModal } from "@/components/editTaskModal";
import { ConfirmActionModal } from "@/components/ConfirmActionModal";
import { SettingsModal } from "@/components/settingsModal";
import TaskOptionsMenu from "@/components/taskOptionsMenu";
import { getTasksForDay } from "./api/tasks";
import { ApiResponse } from "@/types/apiResponse";
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
import Link from "next/link";
import TaskCard from "@/components/TaskCard";
import { CalendarPickerModal } from "@/components/CalendarPickerModal";
import { getLastPostponeUntilDate } from "@/util/task";
import { PulseLoader } from "react-spinners";

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

export async function getServerSideProps(context: any) {
  // TODO this would be better as a util function
  // auth
  const token = await getToken({ req: context.req });
  if (!token) {
    // shouldn't be possible to get to this point
    console.error(`Error initializing: authentication error!`);
    return;
  }
  const userId = token.sub!;

  const today = new Date();
  const initTasks: TaskDto[] = (await getTasksForDay(userId, today)).map(
    taskDaoToDto
  );
  return {
    props: {
      initTasks,
    },
  };
}

export default function Home({ initTasks }: { initTasks: TaskDto[] }) {
  const [selectedDayTasks, setSelectedDayTasks] = useState(
    initTasks.map(dtoTaskToTask) as Task[]
  );
  const [isShowingEditModal, setIsShowingEditModal] = useState(false);
  const [isShowingSettingsModal, setIsShowingSettingsModal] = useState(false);
  const [
    isShowingCompleteOnAnotherDayModal,
    setIsShowingCompleteOnAnotherDayModal,
  ] = useState(false);
  const [isShowingPostponeModal, setIsShowingPostponeModal] = useState(false);
  const [isShowingDeleteModal, setIsShowingDeleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDay, setSelectedDay] = useState<Dayjs>(dayjs());
  const [shownDateRange, setShownDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [isDayTasksLoading, setIsDayTasksLoading] = useState(false);
  const [dayTasks, setDayTasks] = useState<Record<string, TaskDto[]>>({});
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

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
        const result = await fetch(
          `/api/tasks?targetStartDay=${shownStartDay.toISOString()}&targetEndDay=${shownEndDay.toISOString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (result.status !== 200) {
          throw new Error("Failed to fetch multiple tasks.");
        }
        const { data } = (await result.json()) as {
          data: { dayTasks: Record<string, TaskDto[]> };
        };
        setDayTasks(data.dayTasks);
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
      const result = await fetch(`/api/tasks?targetDay=${date.toISOString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (result.status !== 200) {
        throw new Error("Failed to fetch tasks.");
      }
      const { data } = (await result.json()) as {
        data: { dayTasks: Record<string, TaskDto[]> };
      };
      const newTasks =
        data.dayTasks[dayjs(date).format("YYYY-MM-DD")].map(dtoTaskToTask);
      setSelectedDayTasks(newTasks);
      setIsDayTasksLoading(false);
    } catch (maybeError: any) {
      console.error(maybeError);
      // TODO display some error message
    }
  };

  // TODO move to service module
  const completeTask = async (
    completedTaskId: string,
    completedDate?: Date
  ) => {
    // call service to complete task in db
    const result = await fetch(`/api/tasks/${completedTaskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operation: "complete",
        ...(completedDate && { completedDate: completedDate.toISOString() }),
      }),
    });

    const body = await result.json();
    if (result.status !== 200) {
      console.error(`>> error: ${JSON.stringify(body)}`);
      // TODO display some error message
    }
  };

  const handleCompleteTaskOnAnotherDay = async (task: Task) => {
    setSelectedTask(task);
    setIsShowingCompleteOnAnotherDayModal(true);
  };

  const handleConfirmedCompleteTaskOnAnotherDay = useCallback(
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

  const handleCompleteTaskToday = async (completedTaskId: string) => {
    // TODO animate
    // accurate completedDate isn't really necessary here
    const newTasks = selectedDayTasks.map((task) =>
      task.id === completedTaskId ? { ...task, completedDate: dayjs() } : task
    );
    setSelectedDayTasks(newTasks);
    await completeTask(completedTaskId);
  };

  const onAddButtonClick = () => {
    setSelectedTask(null);
    setIsShowingEditModal(true);
  };

  const onSettingsButtonClick = () => {
    setIsShowingSettingsModal(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsShowingEditModal(true);
  };

  // TODO move to service module
  const postponeTask = async (task: Task, postponeUntilDate: Dayjs) => {
    console.log(
      `about to postpone ${task.id} to ${postponeUntilDate.toISOString()}`
    ); // TODO remove
    try {
      // TODO call postpone action endpoint
      const requestBody = {
        operation: "postpone",
        postponeUntilDate: postponeUntilDate.toISOString(),
      };
      const result = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      const responseBody = await result.json();
      if (result.status !== 200) {
        throw new Error(`>> error: ${JSON.stringify(responseBody)}`);
      }
    } catch (maybeError: any) {
      console.error(maybeError);
      // TODO show some error message
    }
  };

  const handlePostponeTask = async (task: Task, postponeDay: Dayjs) => {
    await postponeTask(task, postponeDay);
    // TODO update state and/or re-fetch task data
    setSelectedDayTasks((tasks) => tasks.filter((t) => t.id !== task.id));
  };

  // TODO move to util module and also use on backend
  const isPostponeDayValid = useCallback(
    (day: Date) => {
      // Three conditions need to be met:
      // 1. Is the day after the current date?
      // 2. Is the day after the task startDate?
      // 3. If the task has been postponed before, is the day after the last poneponeUntilDate?
      const taskEffectiveDay = dayjs(
        getLastPostponeUntilDate(selectedTask!) || selectedTask!.startDate
      ).startOf("day");
      const startOfTargetDay = dayjs(day).startOf("day");
      return (
        startOfTargetDay.isAfter(dayjs().startOf("day")) &&
        startOfTargetDay.isAfter(taskEffectiveDay)
      );
    },
    [selectedTask]
  );

  const handlePostponeTaskToAnotherDay = async (task: Task) => {
    setSelectedTask(task);
    setIsShowingPostponeModal(true);
  };

  const handleConfirmedPostponeTask = useCallback(
    async (postponeUntilDate: Date) => {
      // TODO animate
      const selectedId = selectedTask!.id;
      setSelectedDayTasks((tasks) => tasks.filter((t) => t.id !== selectedId));
      await postponeTask(selectedTask!, dayjs(postponeUntilDate));
    },
    [selectedTask, setSelectedDayTasks]
  );

  const handleDeleteTask = async (task: Task) => {
    setSelectedTask(task);
    setIsShowingDeleteModal(true);
  };

  const handleConfirmedDelete = useCallback(async () => {
    if (!selectedTask) return;
    try {
      const result = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const body = await result.json();
      if (result.status !== 200) {
        throw new Error(`>> error: ${JSON.stringify(body)}`);
        // TODO display some error message
      }
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
    [isSidebarVisible]
  );

  return (
    <PanelGroup direction="horizontal" className={`max-h-screen flex`}>
      {isSidebarVisible && (
        <Panel defaultSize={30} minSize={20} order={1}>
          <div className="h-full max-h-full overflow-auto p-2 flex flex-col">
            <div className="grow">
              <div className="text-4xl mb-2">LyfeScheduler</div>
              <div className="cursor-pointer">
                <FontAwesomeIcon
                  icon={faCalendarDays}
                  className="mr-2"
                ></FontAwesomeIcon>
                calendar
              </div>
              <div className="line-through">
                <FontAwesomeIcon
                  icon={faList}
                  className="mr-2"
                ></FontAwesomeIcon>
                all tasks
              </div>
              <div className="line-through">
                <FontAwesomeIcon
                  icon={faTags}
                  className="mr-2"
                ></FontAwesomeIcon>
                tags
              </div>
            </div>
            <div className="footer">
              <Link href="/api/auth/signout">
                <div className="cursor-pointer hover:bg-gray-500/25">
                  <FontAwesomeIcon
                    icon={faArrowRightFromBracket}
                    className="mr-2"
                  ></FontAwesomeIcon>
                  log out
                </div>
              </Link>
              <div
                className="cursor-pointer hover:bg-gray-500/25"
                onClick={onSettingsButtonClick}
              >
                <FontAwesomeIcon
                  icon={faGear}
                  className="mr-2"
                ></FontAwesomeIcon>
                settings
              </div>
            </div>
          </div>
        </Panel>
      )}
      <PanelResizeHandle className="w-2 border-l-2 border-gray-500/25" />

      <Panel minSize={50} order={2}>
        <div className="max-h-full overflow-auto">
          <section className="sticky top-2 pl-2 pr-2">
            <FontAwesomeIcon
              icon={isSidebarVisible ? faArrowLeft : faArrowRight}
              className="cursor-pointer hover:bg-gray-500/25"
              onClick={toggleSidebar}
            ></FontAwesomeIcon>
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

          <section
            className={`flex min-h-screen flex-col items-center pl-8 pr-8`}
          >
            <div
              onClick={onAddButtonClick}
              className="max-w-lg w-full mb-2 px-2 py-1 rounded-xl border-2 border-general-200 hover:bg-gray-200 hover:cursor-pointer text-general-200"
            >
              <FontAwesomeIcon icon={faCirclePlus} className="ml-0.5 mr-3" />
              <span>Add task</span>
            </div>
            {isDayTasksLoading ? (
              // TODO take tailwind classes instead
              <PulseLoader color="#d5dedb" className="mt-4"/>
            ) : (
              selectedDayTasks?.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  selectedDay={selectedDay}
                  onComplete={handleCompleteTaskToday}
                  onCompleteOnAnotherDay={handleCompleteTaskOnAnotherDay}
                  onEdit={handleEditTask}
                  onPostpone={handlePostponeTask}
                  onPostponeToAnotherDay={handlePostponeTaskToAnotherDay}
                  onDelete={handleDeleteTask}
                />
              ))
            )}

            {isShowingEditModal && (
              <EditTaskModal
                isOpen={isShowingEditModal}
                setIsOpen={setIsShowingEditModal}
                setTasks={setSelectedDayTasks}
                task={selectedTask}
                initialStartDate={selectedDay}
              />
            )}
            {isShowingPostponeModal && (
              <CalendarPickerModal
                isOpen={isShowingPostponeModal}
                setIsOpen={setIsShowingPostponeModal}
                onConfirm={handleConfirmedPostponeTask}
                title="Postpone to"
                body={
                  <>
                    <div>
                      Select a day to postpone{" "}
                      <span className="font-semibold">
                        {selectedTask!.title}
                      </span>{" "}
                      to.
                    </div>
                    <div className="text-xs">
                      Note that the selected day must be after the current day,
                      the task&apos;s start date, AND the task&apos;s last
                      postponement.
                    </div>
                  </>
                }
                confirmButtonText="Postpone"
                isDayValid={isPostponeDayValid}
              />
            )}
            {isShowingCompleteOnAnotherDayModal && (
              <CalendarPickerModal
                isOpen={isShowingCompleteOnAnotherDayModal}
                setIsOpen={setIsShowingCompleteOnAnotherDayModal}
                onConfirm={handleConfirmedCompleteTaskOnAnotherDay}
                title="Complete on another day"
                body={
                  <>
                    <div>
                      Forgot to mark this task complete the other day? No
                      problem.
                    </div>
                    <div>
                      Select a day to complete{" "}
                      <span className="font-semibold">
                        {selectedTask!.title}
                      </span>
                      .
                    </div>
                    {selectedTask!.repeatDays && (
                      <div>
                        This task will repeat {selectedTask!.repeatDays} days
                        after the chosen day.
                      </div>
                    )}
                  </>
                }
                confirmButtonText="Complete"
                dayFeedback={(day: Date) => {
                  const dayIsAfterToday = dayjs(day)
                    .startOf("day")
                    .isAfter(dayjs().startOf("day"));
                  if (!dayIsAfterToday) {
                    return <></>;
                  }
                  return (
                    <div className="text-attention leading-tight">
                      The selected day in the future - it&apos;s recommended
                      only to complete tasks on past days.
                    </div>
                  );
                }}
              />
            )}
            {isShowingDeleteModal && (
              <ConfirmActionModal
                isOpen={isShowingDeleteModal}
                setIsOpen={setIsShowingDeleteModal}
                onConfirm={handleConfirmedDelete}
                title="Confirm delete"
                body={
                  (selectedTask && (
                    <div>
                      Are you sure you want to delete{" "}
                      <span className="font-bold">{selectedTask!.title}</span>?
                      <br />
                      This action cannot be undone.
                    </div>
                  )) ||
                  undefined
                }
                confirmButtonText="delete"
                confirmButtonClasses="bg-attention text-ondark"
              />
            )}
            <SettingsModal
              isOpen={isShowingSettingsModal}
              setIsOpen={setIsShowingSettingsModal}
              monthInfoSettings={monthInfoSettings}
              setMonthInfoSettings={setMonthInfoSettings}
              dayInfoSettings={dayInfoSettings}
              setDayInfoSettings={setDayInfoSettings}
            />

            <div id="placeholder" className="h-[50vh]"></div>
          </section>
        </div>
      </Panel>
    </PanelGroup>
  );
}
