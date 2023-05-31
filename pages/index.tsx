import type { TaskDto } from '@/types/task.dto';
import type { TaskViewModel as Task } from '@/types/task.viewModel';
import { Inter } from 'next/font/google';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis, faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { AddTaskModal } from '@/components/addTaskModal';
import { init as initDb, getAllTasks } from '@/services/mongo.service';

const inter = Inter({ subsets: ['latin'] });

function dtoTaskToTask(taskDto: TaskDto): Task {
  let task: any = { ...taskDto };
  task.startDate = dayjs(task.startDate);
  task.endDate = dayjs(task.endDate);
  return task as Task;
}

function calculateTaskFields(task: Task): Task {
  // TODO validate task fields?
  // TODO move this to the backend?
  const newTask: Task = {...task};
  if (newTask.startDate && newTask.rangeDays) {
    newTask.endDate = newTask.startDate.add(newTask.rangeDays, 'days');
    return newTask;
  }
  if (newTask.endDate && newTask.rangeDays) {
    newTask.startDate = newTask.endDate.subtract(newTask.rangeDays, 'days');
    return newTask;
  }
  if (newTask.startDate && newTask.endDate) {
    newTask.rangeDays = newTask.endDate.diff(newTask.startDate, 'days');
    return newTask;
  }
  throw new Error('Invalid task! Needs at least two of [startDate, endDate, rangeDays].');
}

export async function getServerSideProps(context: any) {
  await initDb();
  const initTasks: TaskDto[] = await getAllTasks();
  return {
    props: {
      initTasks
    }
  };
}

export default function Home({ initTasks }: { initTasks: TaskDto[] }) {
  const [tasks, setTasks] = useState(initTasks.map(dtoTaskToTask).map(calculateTaskFields));

  const [isShowingAddModal, setIsShowingAddModal] = useState(false);

  const formatTimeEstimate = (timeEstimateMins: number) => {
    let durationString = '';
    const hours = Math.floor(timeEstimateMins / 60);
    if (hours > 0) {
      durationString += `${hours}h`;
    }
    const mins = timeEstimateMins % 60;
    if (mins > 0) {
      durationString += `${mins}m`;
    }
    return durationString;
  }

  const formatStartDate = (startDate: dayjs.Dayjs) => {
    return startDate.format('MMM DD');
  }
  
  const formatEndDate = (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) => {
    // TODO display year if needed
    const hasDifferentMonth = startDate.month() !== endDate.month();
    return endDate.format(hasDifferentMonth ? 'MMM DD' : 'DD');
  }

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const calculatePriority = (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) => {
    // TODO handle identical start and end 
    // TODO actually might want to do mins instead of days?
    const MIN_PRIORITY = 0;
    const MAX_PRIORITY = 1;
    const rangeHours = endDate.diff(startDate, 'hours');
    const elapsedHours = dayjs().diff(startDate, 'hours');
    console.log(`elapsed: ${elapsedHours} hours of ${rangeHours}`);
    return lerp(MIN_PRIORITY, MAX_PRIORITY, elapsedHours / rangeHours);
  }

  const getStylesForPriority = (priority: number) => {
    if (priority < .5) {
      return {
        bgColor: 'bg-gray-100'
      };
    }
    if (priority < 1) {
      return {
        bgColor: 'bg-orange-100'
      };
    }
    return {
      bgColor: 'bg-red-200'
    };
  };

  const getCompleteTaskHandler = (completedTaskId: string) => async () => {
    // TODO animate
    const newTasks = tasks.filter(({ id }) => id !== completedTaskId);
    setTasks(newTasks);
    // call service to complete task in db
    const result = await fetch(`/api/tasks/${completedTaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'complete'
      }),
    });

    const body = await result.json();
    if (result.status === 200) {
      // console.log('>> Success!!');
      // TODO show success message
    } else {
      console.error(`>> error: ${JSON.stringify(body)}`);
      // TODO show error message
    }
  };

  const renderTask = ({ id, title, timeEstimateMins, startDate, endDate }: Task) => {
    const now = dayjs();
    const normalizedStartDate = startDate || now;
    const normalizedEndDate = endDate || now.add(1, 'day');
    console.log(title);
    const calculatedPriority = calculatePriority(normalizedStartDate, normalizedEndDate);
    const priorityStyles = getStylesForPriority(calculatedPriority);
    const calculatedPoints = Math.round(calculatedPriority * timeEstimateMins);
    const daysOverEndDate = dayjs().diff(normalizedEndDate, 'day');
    return (
      <div key={id} className={`flex justify-between items-center max-w-lg w-full mb-3 p-3 ${priorityStyles.bgColor} shadow-lg rounded-lg text-sm`}>
        <div className="flex justify-start items-baseline">
          <input type='checkbox' className="mr-3" onChange={getCompleteTaskHandler(id)}></input>
          <span className="mr-3 text-lg">{title}</span>
          <span className="italic">{formatTimeEstimate(timeEstimateMins)}</span>
        </div>
        <div className="flex justify-end items-center">
          <span className="mr-3">
            {formatStartDate(normalizedStartDate)} &mdash; {formatEndDate(normalizedStartDate, normalizedEndDate)} 
            {daysOverEndDate > 0 
              ? <span className="text-red-500">+{daysOverEndDate}</span> 
              : null}
          </span>
          {/* <span className="text-sm">({calculatedPriority.toFixed(2)} -&gt; {calculatedPoints} ppts)</span> */}
          <FontAwesomeIcon icon={faEllipsis} className="text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <main
      className={`flex min-h-screen flex-col items-center p-6 pt-12 ${inter.className}`}
    >
      <h1 className="mb-12 text-4xl">~ TODO ~</h1>
      <div onClick={() => setIsShowingAddModal(true)} className="max-w-lg w-full mb-3 p-3 rounded-lg border-2 border-dotted border-gray-500 hover:bg-gray-200 hover:cursor-pointer text-gray-500">
        <FontAwesomeIcon icon={faCirclePlus} />
        <span className="ml-3">Add</span>
      </div>
      {tasks?.map((item) => renderTask(item))}

      <AddTaskModal isOpen={isShowingAddModal} setIsOpen={setIsShowingAddModal} />
    </main>
  )
}
