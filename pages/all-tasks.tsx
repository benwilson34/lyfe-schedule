import type { TaskDto } from "@/types/task.dto";
import type { TaskViewModel as Task } from "@/types/task.viewModel";
import { useState, useCallback } from "react";
import { getToken } from "next-auth/jwt";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faArrowLeft,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import { taskDaoToDto } from "@/types/task.dao";
import TaskCard from "@/components/TaskCard";
import { PulseLoader } from "react-spinners";
import { GetServerSideProps } from "next";
import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { useSidebarContext } from "@/contexts/sidebar-context";
import { useModalContext } from "@/contexts/modal-context";
import { getManyTasks } from "@/services/mongo.service";
import NavBar from "@/components/NavBar";

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

  const initTasks: TaskDto[] = (await getManyTasks(userId)).map(taskDaoToDto);
  return {
    props: {
      initTasks,
    },
  };
}) satisfies GetServerSideProps;

export default function AllTasksView({ initTasks }: { initTasks: TaskDto[] }) {
  const {
    isVisible: isSidebarVisible,
    toggleVisibility: toggleSidebarVisibility,
  } = useSidebarContext();
  const { showAddEditModal } = useModalContext();

  // TODO gonna have to check `initTasks` when switching pages I think
  const [tasks, setTasks] = useState((initTasks.map(dtoTaskToTask) as Task[]).sort((a, b) => a.startDate.isAfter(b.startDate) ? 1 : -1));
  const [isLoading, setIsLoading] = useState(false);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const [shownStartDay, shownEndDay] = shownDateRange;
  //       const dayTasks = await getTasksForDayRange(shownStartDay, shownEndDay);
  //       setDayTasks(dayTasks);
  //     } catch (maybeError) {
  //       console.error(maybeError);
  //       // TODO display some error message
  //     }
  //   };
  //   fetchData();
  // }, [shownDateRange]);

  const afterAddTask = (task: Task) => {
    setTasks((tasks) => [...tasks, task]);
  };

  const handleAddButtonClick = () => {
    showAddEditModal(null, afterAddTask);
  };

  const updateTasks = (task: Task) => {
    setTasks((tasks) => tasks.map((t) => (t.id === task.id ? task : t)));
  };

  const afterDeleteTask = async (deletedTask: Task) => {
    setTasks((tasks) => tasks.filter((t) => t.id !== deletedTask.id));
  };

  const renderTaskCount = useCallback(
    (taskCount: number) => `${taskCount} task${taskCount !== 1 ? "s" : ""}`,
    []
  );

  return (
    <div className="max-h-full overflow-auto">
      <NavBar />

      <section className={`flex flex-col items-center pr-8 pl-8 mb-6`}>
        <h1 className="mb-1 mt-10 text-4xl font-bold">All Tasks</h1>
      </section>

      {/* <section>
        <div className="flex flex-row justify-evenly mb-6">
          <div className="w-1/2">{renderMonthInfo()}</div>
          <div className="w-1/2">{renderDayInfo(selectedDayTasks)}</div>
        </div>
      </section> */}

      <section className={`flex min-h-screen flex-col items-center pl-8 pr-8`}>
        <div
          onClick={handleAddButtonClick}
          className="max-w-lg w-full mb-2 px-2 py-1 rounded-xl border-2 border-general-200 hover:bg-gray-200 hover:cursor-pointer text-general-200"
        >
          <FontAwesomeIcon icon={faCirclePlus} className="ml-0.5 mr-3" />
          <span>Add task</span>
        </div>
        {isLoading ? (
          // TODO take tailwind classes instead
          <PulseLoader color="#d5dedb" className="mt-4" />
        ) : (
          tasks?.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              selectedDay={dayjs()}
              afterComplete={updateTasks}
              afterEdit={updateTasks}
              afterPostpone={updateTasks}
              afterDelete={afterDeleteTask}
            />
          ))
        )}

        <div id="placeholder" className="h-[50vh]"></div>
      </section>
    </div>
  );
}
