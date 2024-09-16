import type { TaskViewModel as Task } from "@/types/task.viewModel";
import dayjs, { Dayjs } from "@/lib/dayjs";
import TaskOptionsMenu from "./TaskOptionsMenu";
import { formatRepeatInterval, formatTimeEstimate } from "@/util/format";
import { calculatePriority } from "@/util/date";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faArrowsRotate,
  faHourglass,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { autoPlacement, useFloating } from "@floating-ui/react";
import { completeTask, deleteTask, postponeTask } from "@/services/api.service";
import { useModalContext } from "@/contexts/modal-context";
import { assign } from "lodash";
import Overlay from "./Overlay";

const getTaskClass = (task: Task, priority: number) => {
  if (task.completedDate) {
    return "task__completed";
  }
  if (priority < 0.5) {
    return "task__priority-low";
  }
  if (priority < 1) {
    return "task__priority-med";
  }
  // else overdue
  return "task__priority-high";
};

const formatStartDate = (startDate: dayjs.Dayjs) => {
  return startDate.format("MMM DD");
};

const formatEndDate = (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) => {
  // TODO display year if needed?
  const hasDifferentMonth = startDate.month() !== endDate.month();
  return endDate.format(hasDifferentMonth ? "MMM DD" : "DD");
};

const formatDateRange = (
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  rangeDays: number
) => {
  return `${formatStartDate(startDate)}${
    rangeDays > 1 ? ` — ${formatEndDate(startDate, endDate)}` : ""
  }`;
};

export default function TaskCard({
  task,
  selectedDay,
  afterComplete,
  afterEdit,
  afterPostpone,
  afterDelete,
}: {
  task: Task;
  selectedDay: dayjs.Dayjs;
  afterComplete: (task: Task, completeDay: Dayjs) => void;
  afterEdit: (task: Task) => void;
  afterPostpone: (task: Task, postponeDay: Dayjs) => void;
  afterDelete: (task: Task) => void;
}) {
  const {
    id,
    title,
    timeEstimateMins,
    startDate,
    rangeDays,
    endDate,
    repeatDays,
    isProjected,
    completedDate,
  } = task;
  const {
    showAddEditModal,
    showPostponeToModal,
    showCompleteOnAnotherDayModal,
    showDeleteModal,
  } = useModalContext();
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const floating = useFloating({
    middleware: [
      autoPlacement({
        allowedPlacements: ["top-end", "bottom-end"],
      }),
    ],
  });
  const calculatedPriority = calculatePriority(startDate, endDate, selectedDay);
  const taskClass = getTaskClass(task, calculatedPriority);
  // const calculatedPoints = Math.round(calculatedPriority * (timeEstimateMins ?? 0));
  const daysOverEndDate = selectedDay.diff(endDate, "day");
  const isCompleted = !!completedDate;
  const isCheckboxDisabled = isCompleted || !selectedDay.isSame(dayjs(), "day");

  const handleCheckboxClick = async () => {
    setIsLoading(true);
    const completedDate = new Date();
    await completeTask(task.id, completedDate);
    // TODO animate checkmark
    afterComplete(assign(task, { completedDate }), selectedDay);
    setIsLoading(false);
  };

  const handleEditOptionClick = () => {
    showAddEditModal(task, afterEdit, selectedDay);
  };

  const handleConfirmedCompleteTaskOnAnotherDay = async (
    completedDate: Date
  ) => {
    setIsLoading(true);
    await completeTask(task.id, completedDate);
    afterComplete(
      assign(task, { completedDate: dayjs(completedDate) }),
      dayjs(completedDate)
    );
    setIsLoading(false);
  };

  const handlePostponeOptionClick = async (postponeDay: Dayjs) => {
    // TODO try-catch?
    setIsLoading(true);
    await postponeTask(task.id, postponeDay);
    afterPostpone(task, postponeDay);
    setIsLoading(false);
  };

  const handlePostponeToAnotherDayOptionClick = () => {
    showPostponeToModal(task, (d) => handlePostponeOptionClick(dayjs(d)));
  };

  const handleCompleteOnAnotherDayOptionClick = () => {
    showCompleteOnAnotherDayModal(
      task,
      handleConfirmedCompleteTaskOnAnotherDay
    );
  };

  const handleConfirmedDelete = async () => {
    // TODO try-catch?
    setIsLoading(true);
    await deleteTask(task.id);
    afterDelete(task);
    setIsLoading(false);
  };

  const handleDeleteOptionClick = () => {
    showDeleteModal(task, handleConfirmedDelete);
  };

  return (
    <>
      <div
        ref={floating.refs.setReference}
        className={`task group/task relative flex justify-between items-stretch max-w-lg w-full px-3 py-2 ${taskClass} shadow-md rounded-xl text-sm ${
          isOptionsMenuOpen ? "task--selected" : ""
        }`}
      >
        <div className="flex justify-start items-center">
          {isLoading ? (
            // TODO take tailwind classes instead
            // <PulseLoader color="#F5F3DE" className="shrink-0 mr-3 w-4 h-4 relative" />
            <div className="loader shrink-0 mr-3 w-4 h-4 relative" />
          ) : (
            <div
              // TODO style disabled checkbox
              className={`task__checkbox shrink-0 mr-3 cursor-pointer w-4 h-4 rounded-[.25rem] relative box-content bg-ondark border`}
              onClick={() => {
                if (isCheckboxDisabled) return;
                handleCheckboxClick();
              }}
            >
              {isCompleted && (
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-2xl absolute top-[-.35rem]"
                ></FontAwesomeIcon>
              )}
            </div>
          )}

          <div
            className="flex flex-col space-y-2"
            style={{ wordBreak: "break-word" }}
          >
            <span className="mr-3 text-base font-semibold leading-none">
              {title}
            </span>

            {/* TODO tags */}
            {/* <span className="mr-3 text-sm font-light leading-none">
              #weekly-goals #chores
            </span> */}
          </div>
        </div>

        <div className="flex items-center">
          <div className="flex flex-col h-full justify-between mr-3">
            <div
              className={`${
                isProjected ? "underline decoration-dotted" : ""
              } text-sm flex justify-end`}
            >
              <div className="whitespace-nowrap">
                {formatDateRange(startDate, endDate, rangeDays)}

                {daysOverEndDate > 0 && (
                  <span
                    className={`task__overdue-chip border rounded-md ml-1 pl-1 pr-1`}
                  >
                    +{daysOverEndDate}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              {timeEstimateMins && (
                <span className="text-sm italic whitespace-nowrap">
                  <FontAwesomeIcon icon={faHourglass} className="mr-0.5" />
                  {formatTimeEstimate(timeEstimateMins)}
                </span>
              )}

              {repeatDays && (
                <span className="text-sm italic whitespace-nowrap">
                  <FontAwesomeIcon icon={faArrowsRotate} className="mr-0.5" />
                  {formatRepeatInterval(repeatDays)}
                </span>
              )}
            </div>
          </div>

          <TaskOptionsMenu
            task={task}
            isDisabled={isLoading}
            selectedDay={selectedDay}
            onMenuOpenChange={(isOpen: boolean) => setIsOptionsMenuOpen(isOpen)}
            onEditClick={handleEditOptionClick}
            onPostponeClick={handlePostponeOptionClick}
            onPostponeToAnotherDayClick={handlePostponeToAnotherDayOptionClick}
            onCompleteOnAnotherDayClick={handleCompleteOnAnotherDayOptionClick}
            onDeleteClick={handleDeleteOptionClick}
            floating={floating}
          />
        </div>
      </div>

      <Overlay isVisible={isOptionsMenuOpen} durationMs={150} />
    </>
  );
}
