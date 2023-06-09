/**
 * @see https://tailwindui.com/components/application-ui/overlays/modals
 * 
 * TODO convert to typescript...need to find type definitions somewhere
 */

import { Fragment, useCallback, useRef, useState, useMemo, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Calendar } from 'react-calendar';
import dayjs from 'dayjs';
import 'react-calendar/dist/Calendar.css';
import { calculateRangeDays } from '@/util/task';

export function AddTaskModal({ isOpen, setIsOpen, setTasks }) {

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs());
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatDays, setRepeatDays] = useState(1);
  const [rangeDays, setRangeDays] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // type DateField = 'startDate' | 'endDate' | 'rangeDays';
  const [lockedField, setLockedField] = useState('rangeDays');

  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (lockedField === 'rangeDays') {
      setRangeDays(calculateRangeDays(startDate, endDate));
      return;
    }
    // TODO calculate other locked fields startDate and endDate
    throw new Error('Not implemented yet');
  });

  const isValid = useMemo(() => {
    // TODO validate new task
    const isValidTitle = typeof title === 'string' && title.trim().length > 0;
    return isValidTitle;
  }, [title]);

  const onRangeFieldChange = useCallback((event) => {
    setRangeDays(event.target.value);
  }, [setRangeDays])

  const onAddButtonClick = useCallback(async () => {
    try {
      const taskToAdd = {
        title,
        startDate: dayjs(startDate),
        endDate: dayjs(endDate),
        rangeDays,
        ...(isRepeating && { repeatDays }),
      };
      console.log('>> about to add task...', taskToAdd);
      
      setIsLoading(true);
      const result = await fetch(`/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskToAdd),
      });
      const body = await result.json();
      if (result.status === 200) {
        // console.log('>> Success!!');
        taskToAdd.id = body.data.taskId;
      } else {
        throw new Error(`>> error: ${JSON.stringify(body)}`);
      }
      setTasks((tasks) => [...tasks, taskToAdd]);
      setIsOpen(false);
      // TODO show some confimation message
    } catch (error) {
      console.error(error);
      // TODO show some error message
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setIsOpen, title, isRepeating]);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" initialFocus={cancelButtonRef} onClose={setIsOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      {/* <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" /> */}
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        Add task
                      </Dialog.Title>
                      <div className="mt-2">
                        <div className="mb-4">
                          Title<span className="text-red-400">*</span>:&nbsp;
                          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}></input>
                        </div>
                        <div className="mb-4">
                          <p>
                            Start date: {startDate.toString()}
                          </p>
                          <Calendar onChange={(d) => setStartDate(dayjs(d))} value={startDate.toDate()} disabled={isLoading || lockedField === 'startDate'}/>
                        </div>
                        <div className="mb-4">
                          <p>
                            End date: {endDate.toString()}
                          </p>
                          <Calendar onChange={(d) => setEndDate(dayjs(d))} value={endDate.toDate()} disabled={isLoading || lockedField === 'endDate'} />
                        </div>
                        <div className="mb-4">
                          Range:&nbsp;
                          <input type="number" onChange={onRangeFieldChange}  value={rangeDays} min={0} disabled={isLoading || lockedField === 'rangeDays'} className="w-12"></input> days
                        </div>
                        <div className="mb-4">
                          <input type="checkbox" onChange={(e) => setIsRepeating(e.target.checked)} className="inline-block"></input>
                          <div className="inline-block">
                            <span>&nbsp;Repeat every </span>
                            <input type='number' value={repeatDays} onChange={(e) => setRepeatDays(parseInt(e.target.value, 10))} min={1} step={1} className="w-12" disabled={isLoading || !isRepeating}></input>
                            <span>&nbsp;days</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-green-300 px-3 py-2 text-sm font-semibold shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                    onClick={onAddButtonClick}
                    disabled={!isValid || isLoading}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={() => setIsOpen(false)}
                    ref={cancelButtonRef}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
