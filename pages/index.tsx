import type { TaskDto } from '@/types/task.dto';
import type { TaskViewModel as Task } from '@/types/task.viewModel';
import { Inter } from 'next/font/google';
import dayjs, { Dayjs } from 'dayjs';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { useState, useCallback, useEffect } from 'react';
import { EditTaskModal } from '@/components/editTaskModal';
import TaskOptionsMenu from '@/components/taskOptionsMenu';
import { init as initDb, getManyTasks } from '@/services/mongo.service';
import { ApiResponse } from '@/types/apiResponse';
import { taskDaoToDto } from '@/types/task.dao';
import { OnArgs, TileContentFunc } from 'react-calendar/dist/cjs/shared/types';

const inter = Inter({ subsets: ['latin'] });

const NUM_DAILY_WORKING_MINS = 4 * 60;

function dtoTaskToTask(taskDto: TaskDto): Task {
  return {
    ...taskDto,
    startDate: dayjs(taskDto.startDate),
    endDate: dayjs(taskDto.endDate),
    ...(taskDto.completedDate && { completedDate: dayjs(taskDto.completedDate) }),
  } as Task;
}

export async function getServerSideProps(context: any) {
  await initDb();
  const initTasks: TaskDto[] = (await getManyTasks({ targetDay: new Date() })).map(taskDaoToDto);
  return {
    props: {
      initTasks
    }
  };
}

export default function Home({ initTasks }: { initTasks: TaskDto[] }) {
  const [tasks, setTasks] = useState(initTasks.map(dtoTaskToTask) as Task[]);
  const [isShowingEditModal, setIsShowingEditModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [selectedDay, setSelectedDay] = useState<Dayjs>(dayjs());
  const [shownDateRange, setShownDateRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [dayTasks, setDayTasks] = useState<Record<string, TaskDto[]>>({});


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shownStartDay, shownEndDay] = shownDateRange;
        const result = await fetch(`/api/tasks?targetStartDay=${shownStartDay.toISOString()}&targetEndDay=${shownEndDay.toISOString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (result.status !== 200) {
          throw new Error('Failed to fetch multiple tasks.');
        }
        const { data } = await result.json() as { data: { dayTasks: Record<string, TaskDto[]> } };
        setDayTasks(data.dayTasks);
      } catch (maybeError) {
        console.error(maybeError);
        // TODO display some error message
      }
    }
    fetchData();
  }, [shownDateRange]);

  const handleSelectedDayChange = async (date: Date) => {
    try {
      setSelectedDay(dayjs(date));
      const result = await fetch(`/api/tasks?targetDay=${date.toISOString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (result.status !== 200) {
        throw new Error('Failed to fetch tasks.');
      }
      const { data } = await result.json() as { data: { dayTasks: Record<string, TaskDto[]> } };
      const newTasks = data.dayTasks[dayjs(date).format('YYYY-MM-DD')].map(dtoTaskToTask);
      setTasks(newTasks);
    } catch (maybeError: any) {
      console.error(maybeError);
      // TODO display some error message
    }
  }

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

  const formatPercentage = (float: number) => `${Math.round(float * 100)}%`;

  const formatStartDate = (startDate: dayjs.Dayjs) => {
    return startDate.format('MMM DD');
  }

  const formatEndDate = (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) => {
    // TODO display year if needed?
    const hasDifferentMonth = startDate.month() !== endDate.month();
    return endDate.format(hasDifferentMonth ? 'MMM DD' : 'DD');
  }

  const formatDateRange = (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs, rangeDays: number) => {
    return `${formatStartDate(startDate)}${rangeDays > 1 ? ` — ${formatEndDate(startDate, endDate)}` : ''}`;
  }

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const renderMonthInfo = useCallback(() => {
    const allTasks = Object.values(dayTasks).flat();
    const totalTimeEstimateMins = allTasks.reduce((total, task) => total + (task.timeEstimateMins || 0), 0);
    const daysInRange = shownDateRange[1].diff(shownDateRange[0], 'day');
    const dailyAverageTaskCount = Math.round(allTasks.length / daysInRange);
    const dailyAverageTimeTotal = Math.round(totalTimeEstimateMins / daysInRange);
    return (
      <div className="mt-2 text-lg font-light italic">
        month: {allTasks.length} tasks/{formatTimeEstimate(totalTimeEstimateMins)} 
        {' '}~{' '}
        daily avg: {dailyAverageTaskCount} tasks/{formatTimeEstimate(dailyAverageTimeTotal)}/{formatPercentage(dailyAverageTimeTotal / NUM_DAILY_WORKING_MINS)}
      </div>
    );
  }, [dayTasks, shownDateRange]);

  const calculatePriority = (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs, currentDay: dayjs.Dayjs) => {
    // TODO handle identical start and end 
    const MIN_PRIORITY = 0;
    const MAX_PRIORITY = 1;
    const rangeHours = endDate.diff(startDate, 'hours');
    const elapsedHours = currentDay.diff(startDate, 'hours');
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
    // accurate completedDate isn't really necessary here
    const newTasks = tasks.map((task) => task.id === completedTaskId ? { ...task, completedDate: dayjs() } : task); 
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
    if (result.status !== 200) {
      console.error(`>> error: ${JSON.stringify(body)}`);
      // TODO display some error message
    }
  };

  const onAddButtonClick = () => {
    setEditTask(null);
    setIsShowingEditModal(true);
  }

  const getEditTaskHandler = (task: Task) => () => {
    setEditTask(task);
    setIsShowingEditModal(true);
  }

  const getDeleteTaskHandler = (task: Task) => async () => {
    try {
      // TODO show confirmation dialog first
      const result = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const body = await result.json();
      if (result.status !== 200) {
        throw new Error(`>> error: ${JSON.stringify(body)}`);
        // TODO display some error message
      }
      setTasks((tasks) => tasks.filter((t) => t.id !== task.id));
    } catch (maybeError: any) {
      console.error(maybeError);
      // TODO show some error message
    }
  }

  const renderTask = (task: Task) => {
    const { id, title, timeEstimateMins, startDate, rangeDays, endDate, isProjected, completedDate } = task;
    const calculatedPriority = calculatePriority(startDate, endDate, selectedDay);
    const priorityStyles = getStylesForPriority(calculatedPriority);
    const bgColor = completedDate ? 'bg-gray-300' : priorityStyles.bgColor;
    const calculatedPoints = Math.round(calculatedPriority * (timeEstimateMins ?? 0));
    const daysOverEndDate = selectedDay.diff(endDate, 'day');
    return (
      <div key={id} className={`flex justify-between items-center max-w-lg w-full mb-3 p-3 ${bgColor} shadow-lg rounded-lg text-sm`}>
        <div className="flex justify-start items-baseline">
          {
            completedDate
              ? (<span className='mr-3 text-lg'>✔</span>) // FA icon instead?
              : (<input 
                  type='checkbox'
                  className="mr-3"
                  onChange={getCompleteTaskHandler(id)} 
                  disabled={!selectedDay.isSame(dayjs(), 'day')}>
                  </input>)
          }
          <div>
            <span className="mr-3 text-lg">{title}</span>
            <span className="italic mr-3">{formatTimeEstimate(timeEstimateMins ?? 0)}</span>
          </div>
        </div>
        <div className="flex justify-end items-center">
          <span className={`mr-3 ${isProjected ? 'underline decoration-dotted' : ''}`}>
            <div className="whitespace-nowrap">
              {formatDateRange(startDate, endDate, rangeDays)}
              {daysOverEndDate > 0
                ? <span className="text-red-500">+{daysOverEndDate}</span>
                : null}
            </div>
          </span>
          {/* <span className="text-sm">({calculatedPriority.toFixed(2)} -&gt; {calculatedPoints} ppts)</span> */}
          <TaskOptionsMenu task={task} onEditClick={getEditTaskHandler(task)} onDeleteClick={getDeleteTaskHandler(task)} />
        </div>
      </div>
    );
  }

  const onActiveStartDateChange = ({ activeStartDate, view }: OnArgs): any => {
    if (view !== 'month') return;
    const shownStartDate = dayjs(activeStartDate);
    setShownDateRange([shownStartDate, shownStartDate.endOf('month')]);
  };

  const formatShownDate = (day: Dayjs): string => day.format('ddd MMM D');

  const tileContent: TileContentFunc = ({ date, view }) => {
    const day = dayjs(date);
    const dayKey = day.format('YYYY-MM-DD'); // TODO use same util function as backend
    if (view !== 'month') return null;
    const dayIsInPast = day.startOf('day').isBefore(dayjs().startOf('day'));
    if (dayTasks?.[dayKey]) {
      const count = dayTasks[dayKey].length;
      return (
        <div className='flex flex-col justify-between items-start h-full w-full p-1'>
          {/* TODO add default classes, see node_modules\react-calendar\dist\Calendar.css */}
          <div className='grow'>
            <div className={`${dayIsInPast ? 'crossed text-gray-400' : ''} border-gray-400/25 border-r-2 border-b-2 rounded-br-md pr-1`}>{day.format('DD')}</div>
          </div>
          {/* <div className='border-l-2'></div> */}
          <div className='w-full flex justify-end'>
            <div className={`${count > 0 ? 'text-black' : 'text-black/25'} text-xs italic text-right align-text-bottom`}>{count}</div>
          </div>
        </div>
      );
    }
  };

  const tileClassName = useCallback(({ date, view }: { date: Date, view: string }) => {
    const commonClasses = 'p-0 h-10 rounded-lg text-left align-top shadow-md';
    if (view !== 'month') return commonClasses;
    if (dayjs(date).startOf('day') < dayjs().startOf('day')) {
      return `${commonClasses} bg-gray-300`;
    }
    return `${commonClasses} border-black border-1`;
  }, []);

  const renderTaskCount = useCallback((taskCount: number) => `${taskCount} task${taskCount !== 1 ? 's' : ''}`, []);

  const renderDayInfo = useCallback((tasks: Task[]) => {
    if (tasks.length === 0) return `0 tasks 😌`;

    const completedTasks = tasks.filter((task) => task.completedDate);
    const remainingTasks = tasks.filter((task) => !task.completedDate);
    const completedTimeMins = completedTasks.reduce((total, task) => total + (task.timeEstimateMins || 0), 0);
    const remainingTimeMins = remainingTasks.reduce((total, task) => total + (task.timeEstimateMins || 0), 0);
    let string = `remain: ${renderTaskCount(remainingTasks.length)}/${formatTimeEstimate(remainingTimeMins)}/${formatPercentage(remainingTimeMins / NUM_DAILY_WORKING_MINS)}`;
    if (completedTasks.length > 0) {
      string +=` ~ done: ${renderTaskCount(completedTasks.length)}/${formatTimeEstimate(completedTimeMins)}/${formatPercentage(completedTimeMins / NUM_DAILY_WORKING_MINS)}`;
    }
    return string;
  }, []);

  return (
    <main className={`${inter.className}`}>
      <section className={`flex flex-col items-center p-6 pt-12`} >
        {/* TODO mobile layout */}
        <Calendar 
          onChange={(d) => handleSelectedDayChange(d as Date)} 
          value={selectedDay.toDate()}
          minDetail='decade'
          onActiveStartDateChange={onActiveStartDateChange}
          tileContent={tileContent} 
          tileClassName={tileClassName} 
        />
        {renderMonthInfo()}
      </section>
      <section
        className={`flex min-h-screen flex-col items-center p-6 pt-12`}
      >
        <h1 className="mb-1 text-4xl">~~~ TODO: {formatShownDate(selectedDay)} ~~~</h1>
        <h3 className="mb-8 text-lg font-light italic">
          {renderDayInfo(tasks)}
        </h3>
        <div onClick={onAddButtonClick} className="max-w-lg w-full mb-3 p-3 rounded-lg border-2 border-dotted border-gray-500 hover:bg-gray-200 hover:cursor-pointer text-gray-500">
          <FontAwesomeIcon icon={faCirclePlus} />
          <span className="ml-3">Add</span>
        </div>
        {tasks?.map((item) => renderTask(item))}

        <EditTaskModal isOpen={isShowingEditModal} setIsOpen={setIsShowingEditModal} setTasks={setTasks} task={editTask} />
      </section>
    </main>
  )
}
