/**
 * @see https://tailwindui.com/components/application-ui/overlays/modals
 * 
 * TODO convert to typescript...need to find type definitions somewhere
 */

import { Fragment, useCallback, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';

export function ConfirmActionModal({ 
  isOpen, 
  setIsOpen, 
  title = "confirm action", 
  body = (
    <div className='text-md'>
      Are you sure you want to continue?
    </div>
  ),
  onConfirm,
  confirmButtonText = "confirm",
  confirmButtonClasses = 'bg-green-300 hover:bg-green-500',
}) {
  const cancelButtonRef = useRef(null);

  const onConfirmButtonClick = useCallback(() => {
    setIsOpen(false);
    onConfirm();
  }, [onConfirm, setIsOpen])

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
                        {title || "confirm action"}
                      </Dialog.Title>
                      <div className="mt-2">
                        {body}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse justify-between sm:px-6">
                  <button
                    type="button"
                    className={`inline-flex w-full justify-center rounded-md  px-3 py-2 text-sm font-semibold shadow-sm  sm:ml-3 sm:w-auto disabled:bg-gray-400 ${confirmButtonClasses}`}
                    onClick={onConfirmButtonClick}
                  >
                    {confirmButtonText}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={() => setIsOpen(false)}
                    ref={cancelButtonRef}
                  >
                    cancel
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
