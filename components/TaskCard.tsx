import type { TaskViewModel as Task } from "@/types/task.viewModel";
import dayjs, { Dayjs } from "dayjs";
import TaskOptionsMenu from "./taskOptionsMenu";
import { formatTimeEstimate } from "@/util/format";
import { calculatePriority } from "@/util/date";

const getTaskClass = (task: Task, priority: number) => {
  if (task.completedDate) {
    return 'task__completed';
  }
  if (priority < 0.5) {
    return 'task__priority-low';
  }
  if (priority < 1) {
    return 'task__priority-med';
  }
  // else overdue
  return 'task__priority-high';
}

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
  onComplete,
  onEdit,
  onPostpone,
  onDelete,
}: {
  task: Task;
  selectedDay: dayjs.Dayjs;
  onComplete: Function;
  onEdit: Function;
  onPostpone: Function;
  onDelete: Function;
}) {
  const {
    id,
    title,
    timeEstimateMins,
    startDate,
    rangeDays,
    endDate,
    isProjected,
    completedDate,
  } = task;
  const calculatedPriority = calculatePriority(startDate, endDate, selectedDay);
  const taskClass = getTaskClass(task, calculatedPriority);
  // const calculatedPoints = Math.round(calculatedPriority * (timeEstimateMins ?? 0));
  const daysOverEndDate = selectedDay.diff(endDate, "day");
  const isCompleted = !!completedDate;
  const isCheckboxDisabled = isCompleted || !selectedDay.isSame(dayjs(), "day");
  return (
    <div
      className={`group/task flex justify-between items-center max-w-lg w-full mb-2 px-3 py-2 ${taskClass} shadow-lg rounded-xl text-sm`}
    >
      <div className="flex justify-start items-center">
        <div
          className={`task__checkbox shrink-0 mr-3 cursor-pointer w-4 h-4 rounded-[.25rem] relative`}
          onClick={() => {
            if (isCheckboxDisabled) return;
            onComplete(id);
          }}
        >
          {isCompleted && (
            <span className="text-2xl absolute top-[-.75rem]">✔</span> // FA icon instead?
          )}
        </div>
        <div>
          <span className="mr-3 text-base font-semibold leading-none">{title}</span>
          <span className="mr-3 text-sm italic">
            {formatTimeEstimate(timeEstimateMins ?? 0)}
          </span>
        </div>
      </div>
      <div className="flex justify-end items-center">
        <span
          className={`mr-3 ${
            isProjected ? "underline decoration-dotted" : ""
          } text-sm`}
        >
          <div className="whitespace-nowrap">
            {formatDateRange(startDate, endDate, rangeDays)}
            {daysOverEndDate > 0 && (
              <span
                className={`border rounded-md ml-1 pl-1 pr-1`}
              >
                +{daysOverEndDate}
              </span>
            )}
          </div>
        </span>
        {/* <span className="text-sm">({calculatedPriority.toFixed(2)})</span> */}
        <TaskOptionsMenu
          task={task}
          selectedDay={selectedDay}
          onEditClick={() => onEdit(task)}
          onPostponeClick={(postponeDay: Dayjs) => onPostpone(task, postponeDay)}
          onDeleteClick={() => onDelete(task)}
        />
      </div>
    </div>
  );
}
