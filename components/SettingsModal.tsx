/**
 * @see https://tailwindui.com/components/application-ui/overlays/modals
 */

import { Dispatch, Fragment, useCallback, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import Toggle from "react-toggle";
import { ConfirmActionModal } from "./ConfirmActionModal";
import {
  DayInfoSettings,
  MonthInfoSettings,
} from "@/contexts/settings-context";
import { Exo_2 } from "next/font/google";
import { deleteAllTasks } from "@/services/api.service";

export function SettingsModal({
  isOpen,
  setIsOpen,
  monthInfoSettings,
  setMonthInfoSettings,
  dayInfoSettings,
  setDayInfoSettings,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  monthInfoSettings: MonthInfoSettings;
  setMonthInfoSettings: Dispatch<React.SetStateAction<MonthInfoSettings>>;
  dayInfoSettings: DayInfoSettings;
  setDayInfoSettings: Dispatch<React.SetStateAction<DayInfoSettings>>;
}) {
  // TODO just use `useSettingsContext` here instead of using all these props

  const [isLoading, setIsLoading] = useState(false);
  const [isShowingDeleteAllModal, setIsShowingDeleteAllModal] = useState(false);

  const onSaveButtonClick = useCallback(() => {
    localStorage.setItem(
      "settings",
      JSON.stringify({
        monthInfoSettings,
        dayInfoSettings,
      })
    );
    setIsOpen(false);
  }, [monthInfoSettings, dayInfoSettings, setIsOpen]);

  const onDeleteAllTasksButtonClick = useCallback(() => {
    setIsShowingDeleteAllModal(true);
  }, []);

  const onConfirmDeleteAllTasksButtonClick = useCallback(async () => {
    if (isLoading) {
      return;
    }
    try {
      setIsLoading(true);
      await deleteAllTasks();
    } catch (maybeError: any) {
      // TODO display error message
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, setIsLoading]);

  const cancelButtonRef = useRef(null);

  const renderToggle = (
    isChecked: boolean,
    onChange: (isChecked: boolean) => any,
    label: string
  ) => (
    <label className="block mb-1">
      <Toggle
        defaultChecked={isChecked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="ml-2 relative -top-1">{label}</span>
    </label>
  );

  const renderBody = () => (
    <>
      <div className="text-md font-bold mt-4 mb-2">month info bar</div>

      {renderToggle(
        monthInfoSettings.isShowing,
        (isChecked) => {
          setMonthInfoSettings((prevSettings) => {
            prevSettings.isShowing = isChecked;
            return prevSettings;
          });
        },
        "show month info bar"
      )}

      {renderToggle(
        monthInfoSettings.monthTotalSection.isTaskCountShowing,
        (isChecked) => {
          setMonthInfoSettings((prevSettings) => {
            prevSettings.monthTotalSection.isTaskCountShowing = isChecked;
            return prevSettings;
          });
        },
        "show month total task count"
      )}

      {renderToggle(
        monthInfoSettings.monthTotalSection.isTimeEstimateShowing,
        (isChecked) => {
          setMonthInfoSettings((prevSettings) => {
            prevSettings.monthTotalSection.isTimeEstimateShowing = isChecked;
            return prevSettings;
          });
        },
        "show month total time estimate"
      )}

      {renderToggle(
        monthInfoSettings.dailyAverageSection.isTaskCountShowing,
        (isChecked) => {
          setMonthInfoSettings((prevSettings) => {
            prevSettings.dailyAverageSection.isTaskCountShowing = isChecked;
            return prevSettings;
          });
        },
        "show daily average task count"
      )}

      {renderToggle(
        monthInfoSettings.dailyAverageSection.isTimeEstimateShowing,
        (isChecked) => {
          setMonthInfoSettings((prevSettings) => {
            prevSettings.dailyAverageSection.isTimeEstimateShowing = isChecked;
            return prevSettings;
          });
        },
        "show daily average time estimate"
      )}

      {renderToggle(
        monthInfoSettings.dailyAverageSection.isTimePercentageShowing,
        (isChecked) => {
          setMonthInfoSettings((prevSettings) => {
            prevSettings.dailyAverageSection.isTimePercentageShowing =
              isChecked;
            return prevSettings;
          });
        },
        "show daily average time percentage"
      )}

      <div className="text-md font-bold mt-4 mb-2">day info bar</div>

      {renderToggle(
        dayInfoSettings.isShowing,
        (isChecked) => {
          setDayInfoSettings((prevSettings) => {
            prevSettings.isShowing = isChecked;
            return prevSettings;
          });
        },
        "show day info bar"
      )}

      {renderToggle(
        dayInfoSettings.remainingTaskSection.isTaskCountShowing,
        (isChecked) => {
          setDayInfoSettings((prevSettings) => {
            prevSettings.remainingTaskSection.isTaskCountShowing = isChecked;
            return prevSettings;
          });
        },
        "show remaining task count"
      )}

      {renderToggle(
        dayInfoSettings.remainingTaskSection.isTimeEstimateShowing,
        (isChecked) => {
          setDayInfoSettings((prevSettings) => {
            prevSettings.remainingTaskSection.isTimeEstimateShowing = isChecked;
            return prevSettings;
          });
        },
        "show remaining time estimate"
      )}

      {renderToggle(
        dayInfoSettings.remainingTaskSection.isTimePercentageShowing,
        (isChecked) => {
          setDayInfoSettings((prevSettings) => {
            prevSettings.remainingTaskSection.isTimePercentageShowing =
              isChecked;
            return prevSettings;
          });
        },
        "show remaining time percentage"
      )}

      {renderToggle(
        dayInfoSettings.completedTaskSection.isTaskCountShowing,
        (isChecked) => {
          setDayInfoSettings((prevSettings) => {
            prevSettings.completedTaskSection.isTaskCountShowing = isChecked;
            return prevSettings;
          });
        },
        "show completed task count"
      )}

      {renderToggle(
        dayInfoSettings.completedTaskSection.isTimeEstimateShowing,
        (isChecked) => {
          setDayInfoSettings((prevSettings) => {
            prevSettings.completedTaskSection.isTimeEstimateShowing = isChecked;
            return prevSettings;
          });
        },
        "show completed time estimate"
      )}

      {renderToggle(
        dayInfoSettings.completedTaskSection.isTimePercentageShowing,
        (isChecked) => {
          setDayInfoSettings((prevSettings) => {
            prevSettings.completedTaskSection.isTimePercentageShowing =
              isChecked;
            return prevSettings;
          });
        },
        "show completed time percentage"
      )}

      <div className="mt-4">
        <button
          type="button"
          className="inline-flex w-full justify-center rounded-md bg-attention text-ondark px-3 py-2 text-sm font-semibold shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:bg-gray-400"
          onClick={onDeleteAllTasksButtonClick}
        >
          Delete all tasks
        </button>
      </div>
    </>
  );

  if (!isOpen) return null;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className={`relative z-10`}
        initialFocus={cancelButtonRef}
        onClose={setIsOpen}
      >
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-background text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="px-8 sm:px-12 pt-4">
                  <div className="flex flex-row justify-center">
                    <div className="mt-3">
                      <Dialog.Title
                        as="h3"
                        className="text-lg text-center font-semibold leading-6 uppercase mb-6"
                      >
                        settings
                      </Dialog.Title>
                      <div className="mt-2">{renderBody()}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 px-10 py-3 flex flex-row justify-between">
                  <button
                    type="button"
                    className="inline-flex justify-center items-center rounded-full px-5 py-1 text-sm font-semibold shadow-md ring-1 ring-inset ring-general hover:bg-gray-50 mt-0 w-32 uppercase"
                    onClick={() => setIsOpen(false)}
                    ref={cancelButtonRef}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="inline-flex justify-center items-center rounded-full px-5 py-1 text-sm font-semibold shadow-md ml-3 w-40 bg-accent text-ondark disabled:bg-disabled-200 uppercase"
                    onClick={onSaveButtonClick}
                  >
                    Save & Close
                  </button>
                </div>

                {/* TODO use the settings context instead */}
                <ConfirmActionModal
                  isOpen={isShowingDeleteAllModal}
                  setIsOpen={setIsShowingDeleteAllModal}
                  onConfirm={onConfirmDeleteAllTasksButtonClick}
                  title="Confirm delete"
                  body={
                    <div className="text-md">
                      are you sure you want to delete{" "}
                      <span className="font-bold text-red-500">all tasks</span>?
                      This action cannot be undone.
                    </div>
                  }
                  confirmButtonText="delete"
                  confirmButtonClasses="bg-red-300 hover:bg-red-500"
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
