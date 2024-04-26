/**
 * @see https://tailwindui.com/components/application-ui/overlays/modals
 * 
 * TODO convert to typescript...need to find type definitions somewhere
 */

import { Fragment, useCallback, useRef, useState, useMemo, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import dayjs from 'dayjs';
import { calculateRangeDays } from '@/util/task';
import { assign } from 'lodash';
import { ConfirmActionModal } from './ConfirmActionModal';

export function SettingsModal({ isOpen, setIsOpen, monthInfoSettings, setMonthInfoSettings, dayInfoSettings, setDayInfoSettings }) {
  // TODO just use `useSettingsContext` here instead of using all these props

  const [isLoading, setIsLoading] = useState(false);
  const [isShowingDeleteAllModal, setIsShowingDeleteAllModal] = useState(false);

  const onSaveButtonClick = useCallback(() => {
    localStorage.setItem('settings', JSON.stringify({
      monthInfoSettings,
      dayInfoSettings,
    }))
  }, [monthInfoSettings, dayInfoSettings]);

  const onDeleteAllTasksButtonClick = useCallback(() => {
    setIsShowingDeleteAllModal(true);
  }, []);

  const onConfirmDeleteAllTasksButtonClick = useCallback(async () => {
    const result = await fetch(`/api/tasks`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    if (result.status !== 200) {
      throw new Error('Failed to delete tasks.');
    }
    const { data } = await result.json();
  }, []);

  const cancelButtonRef = useRef(null);

  if (!isOpen) return null;

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
                        settings
                      </Dialog.Title>
                      <div className="mt-2">
                        <div className='text-md font-bold'>
                          month info bar
                        </div>

                        <div>
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              const updatedSettings = { ...monthInfoSettings };
                              updatedSettings.isShowing = e.target.checked;
                              setMonthInfoSettings(updatedSettings);
                            }}
                            className="mr-2"
                            checked={monthInfoSettings.isShowing}
                          ></input>
                          <div className="inline-block">
                            show month info bar
                          </div>
                        </div>

                        <div>
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              const updatedSettings = { ...monthInfoSettings };
                              updatedSettings.monthTotalSection.isTaskCountShowing = e.target.checked;
                              setMonthInfoSettings(updatedSettings);
                            }}
                            className="mr-2"
                            checked={monthInfoSettings.monthTotalSection.isTaskCountShowing}
                          ></input>
                          <div className="inline-block">
                            show month total task count
                          </div>
                        </div>

                        <div>
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              const updatedSettings = { ...monthInfoSettings };
                              updatedSettings.monthTotalSection.isTimeEstimateShowing = e.target.checked;
                              setMonthInfoSettings(updatedSettings);
                            }}
                            className="mr-2"
                            checked={monthInfoSettings.monthTotalSection.isTimeEstimateShowing}
                          ></input>
                          <div className="inline-block">
                            show month total time estimate
                          </div>
                        </div>
                        
                        <div>
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              const updatedSettings = { ...monthInfoSettings };
                              updatedSettings.dailyAverageSection.isTaskCountShowing = e.target.checked;
                              setMonthInfoSettings(updatedSettings);
                            }}
                            className="mr-2"
                            checked={monthInfoSettings.dailyAverageSection.isTaskCountShowing}
                          ></input>
                          <div className="inline-block">
                            show daily average task count
                          </div>
                        </div>
                        
                        <div>
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              const updatedSettings = { ...monthInfoSettings };
                              updatedSettings.monthTotalSection.dailyAverageSection.isTimeEstimateShowing = e.target.checked;
                              setMonthInfoSettings(updatedSettings);
                            }}
                            className="mr-2"
                            checked={monthInfoSettings.dailyAverageSection.isTimeEstimateShowing}
                          ></input>
                          <div className="inline-block">
                            show daily average time estimate
                          </div>
                        </div>

                        <div>
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              const updatedSettings = { ...monthInfoSettings };
                              updatedSettings.dailyAverageSection.isTimePercentageShowing = e.target.checked;
                              setMonthInfoSettings(updatedSettings);
                            }}
                            className="mr-2"
                            checked={monthInfoSettings.dailyAverageSection.isTimePercentageShowing}
                          ></input>
                          <div className="inline-block">
                            show daily average time percentage
                          </div>
                        </div>

                        <div className='text-md font-bold'>
                          day info bar
                        </div>

                        <div>
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              const updatedSettings = { ...dayInfoSettings };
                              updatedSettings.isShowing = e.target.checked;
                              setDayInfoSettings(updatedSettings);
                            }}
                            className="mr-2"
                            checked={dayInfoSettings.isShowing}
                          ></input>
                          <div className="inline-block">
                            show day info bar
                          </div>
                        </div>

                        <div>
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              const updatedSettings = { ...dayInfoSettings };
                              updatedSettings.remainingTaskSection.isTaskCountShowing = e.target.checked;
                              setDayInfoSettings(updatedSettings);
                            }}
                            className="mr-2"
                            checked={dayInfoSettings.remainingTaskSection.isTaskCountShowing}
                          ></input>
                          <div className="inline-block">
                            show remaining task count
                          </div>
                        </div>

                        <div>
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              const updatedSettings = { ...dayInfoSettings };
                              updatedSettings.remainingTaskSection.isTimeEstimateShowing = e.target.checked;
                              setDayInfoSettings(updatedSettings);
                            }}
                            className="mr-2"
                            checked={dayInfoSettings.remainingTaskSection.isTimeEstimateShowing}
                          ></input>
                          <div className="inline-block">
                            show remaining time estimate
                          </div>
                        </div>

                        <div>
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              const updatedSettings = { ...dayInfoSettings };
                              updatedSettings.remainingTaskSection.isTimePercentageShowing = e.target.checked;
                              setDayInfoSettings(updatedSettings);
                            }}
                            className="mr-2"
                            checked={dayInfoSettings.remainingTaskSection.isTimePercentageShowing}
                          ></input>
                          <div className="inline-block">
                            show remaining time percentage
                          </div>
                        </div>

                        <div>
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              const updatedSettings = { ...dayInfoSettings };
                              updatedSettings.completedTaskSection.isTaskCountShowing = e.target.checked;
                              setDayInfoSettings(updatedSettings);
                            }}
                            className="mr-2"
                            checked={dayInfoSettings.completedTaskSection.isTaskCountShowing}
                          ></input>
                          <div className="inline-block">
                            show completed task count
                          </div>
                        </div>

                        <div>
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              const updatedSettings = { ...dayInfoSettings };
                              updatedSettings.completedTaskSection.isTimeEstimateShowing = e.target.checked;
                              setDayInfoSettings(updatedSettings);
                            }}
                            className="mr-2"
                            checked={dayInfoSettings.completedTaskSection.isTimeEstimateShowing}
                          ></input>
                          <div className="inline-block">
                            show completed time estimate
                          </div>
                        </div>

                        <div>
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              const updatedSettings = { ...dayInfoSettings };
                              updatedSettings.completedTaskSection.isTimePercentageShowing = e.target.checked;
                              setDayInfoSettings(updatedSettings);
                            }}
                            className="mr-2"
                            checked={dayInfoSettings.completedTaskSection.isTimePercentageShowing}
                          ></input>
                          <div className="inline-block">
                            show completed time percentage
                          </div>
                        </div>

                        <div>
                        <button
                          type="button"
                          className="inline-flex w-full justify-center rounded-md bg-red-300 px-3 py-2 text-sm font-semibold shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:bg-gray-400"
                          onClick={onDeleteAllTasksButtonClick}
                        >
                          Delete all tasks
                        </button>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-green-300 px-3 py-2 text-sm font-semibold shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:bg-gray-400"
                    onClick={onSaveButtonClick}
                  >
                    Save
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
                
                <ConfirmActionModal 
                  isOpen={isShowingDeleteAllModal}
                  setIsOpen={setIsShowingDeleteAllModal}
                  onConfirm={onConfirmDeleteAllTasksButtonClick}
                  title="Confirm delete"
                  body={(
                    <div className='text-md'>
                      are you sure you want to delete <span className="font-bold text-red-500">all tasks</span>? This action cannot be undone.
                    </div>
                  )}
                  confirmButtonText='delete'
                  confirmButtonClasses="bg-red-300 hover:bg-red-500"
                />
              </Dialog.Panel>

            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
