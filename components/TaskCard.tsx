import type { TaskViewModel as Task } from "@/types/task.viewModel";
import dayjs, { Dayjs } from "@/lib/dayjs";
import TaskOptionsMenu from "./TaskOptionsMenu";
import { formatRepeatInterval, formatShownDate, formatTimeEstimate } from "@/util/format";
import { calculatePriority } from "@/util/date";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { faCalendar, faClock } from "@fortawesome/free-regular-svg-icons";
import { useMemo, useState } from "react";
import { autoPlacement, useFloating } from "@floating-ui/react";
import { completeTask, deleteTask, postponeTask } from "@/services/api.service";
import { useModalContext } from "@/contexts/modal-context";
import { assign } from "lodash";
import Overlay from "./Overlay";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

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
    rangeDays > 1 ? `–${formatEndDate(startDate, endDate)}` : ""
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
    tags,
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
  // const calculatedPriority = calculatePriority(startDate, endDate, selectedDay);
  // const calculatedPoints = Math.round(calculatedPriority * (timeEstimateMins ?? 0));
  const daysOverEndDate = useMemo(
    () => selectedDay.startOf("day").diff(endDate.startOf("day"), "day"),
    [selectedDay, endDate]
  );
  const isCompleted = !!completedDate;
  const isCheckboxDisabled = isCompleted || !selectedDay.isSame(dayjs(), "day");
  const router = useRouter();

  const showToastForCreatedRepeatingTask = (startDateString: string) => {
    toast(`Task will repeat on ${formatShownDate(dayjs(startDateString))}`);
  };

  const handleCheckboxClick = async () => {
    setIsLoading(true);
    const completedDate = new Date();
    const createdRepeatingTaskStartDate = await completeTask(task.id, completedDate);
    if (createdRepeatingTaskStartDate) {
      showToastForCreatedRepeatingTask(createdRepeatingTaskStartDate);
    }
    // TODO animate checkmark
    afterComplete(assign(task, { completedDate }), selectedDay);
    setIsLoading(false);
  };

  const handleTagClick = (tagName: string) => {
    router.push(`/tagged/${tagName}`);
  };

  const handleEditOptionClick = () => {
    showAddEditModal(task, afterEdit, { initialStartDate: selectedDay });
  };

  const handleConfirmedCompleteTaskOnAnotherDay = async (
    completedDate: Date
  ) => {
    setIsLoading(true);
    const createdRepeatingTaskStartDate = await completeTask(task.id, completedDate);
    const completeDay = dayjs(completedDate)
    afterComplete(
      assign(task, { completedDate: completeDay }),
      completeDay
    );
    toast(`Task completed on ${formatShownDate(completeDay)}`);
    if (createdRepeatingTaskStartDate) {
      showToastForCreatedRepeatingTask(createdRepeatingTaskStartDate);
    }
    setIsLoading(false);
  };

  const handlePostponeOptionClick = async (postponeDay: Dayjs) => {
    // TODO try-catch?
    setIsLoading(true);
    await postponeTask(task.id, postponeDay);
    toast(`Task postponed to ${formatShownDate(postponeDay)}`);
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
    toast(`Task deleted`);
    afterDelete(task);
    setIsLoading(false);
  };

  const handleDeleteOptionClick = () => {
    showDeleteModal(task, handleConfirmedDelete);
  };

  const renderTags = (tags?: string[]) => {
    if (!tags || tags.length === 0) {
      return null;
    }
    return (
      <div className="flex flex-wrap gap-x-2 text-sm leading-none mt-2">
        {tags.map((tag) => (
          <div
            key={tag}
            className="cursor-pointer"
            onClick={() => handleTagClick(tag)}
          >
            #{tag}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div
        ref={floating.refs.setReference}
        className={`task ${completedDate ? "task--completed" : ""} ${
          isOptionsMenuOpen ? "task--selected" : ""
        } group/task relative flex justify-between items-center gap-x-3 max-w-lg w-full px-3 py-2 shadow-md rounded-xl text-sm`}
      >
        {daysOverEndDate > 0 && (
          <div className="task__overdue-chip text-xs italic whitespace-nowrap rounded-full pb-1 pt-0.5 pl-1 pr-2 absolute -top-3 -left-5 border-2 border-r-background border-b-background border-t-transparent border-l-transparent bg-clip-padding">
            +{daysOverEndDate} day{daysOverEndDate > 1 ? "s" : ""}
          </div>
        )}

        {isLoading ? (
          <div className="loader task__loader shrink-0 box-content w-4 h-4" />
        ) : (
          <div
            // TODO style disabled checkbox
            className={`task__checkbox ${
              isCheckboxDisabled ? "task__checkbox--disabled" : ""
            } shrink-0 w-4 h-4 rounded-[.25rem] relative box-content bg-ondark border-2`}
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

        {/* content area */}
        <div className="flex-grow flex flex-col justify-between xs:space-x-3 xs:flex-row">
          <div
            className="flex flex-col justify-center"
            style={{ wordBreak: "break-word" }}
          >
            <div className="text-base font-semibold leading-none">{title}</div>

            <div className="hidden xs:block">{renderTags(tags)}</div>
          </div>

          <div className="flex flex-row flex-wrap xs:justify-between xs:flex-col mt-2 xs:mt-0">
            <div
              className={`${
                isProjected ? "underline decoration-dotted" : ""
              } text-sm flex justify-end mr-3 xs:mr-0`}
            >
              <div
                className={`task__date-range ${
                  daysOverEndDate > 0 ? "task__date-range--attention" : ""
                } whitespace-nowrap`}
              >
                <FontAwesomeIcon icon={faCalendar} className="mr-1" />

                {formatDateRange(startDate, endDate, rangeDays)}

                {/* {daysOverEndDate > 0 && (
                  <span
                    className={`task__overdue-chip border rounded-md ml-1 pl-0.5 pr-1`}
                  >
                    +{daysOverEndDate}
                  </span>
                )} */}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              {timeEstimateMins && (
                <span className="text-sm italic whitespace-nowrap">
                  <FontAwesomeIcon icon={faClock} className="mr-0.5" />
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

          <div className="block xs:hidden" style={{ wordBreak: "break-word" }}>
            {renderTags(tags)}
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

      <Overlay isVisible={isOptionsMenuOpen} durationMs={150} />
    </>
  );
}
