/**
 * @see https://tailwindui.com/components/application-ui/overlays/modals
 *
 * TODO convert to typescript...need to find type definitions somewhere
 */

import { Fragment, useCallback, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { Exo_2 } from "next/font/google";

const exo2 = Exo_2({ subsets: ["latin"] });

export function ConfirmActionModal({
  isOpen,
  setIsOpen,
  icon = faCircleExclamation,
  title = "confirm action",
  body = <div className="text-md">Are you sure you want to continue?</div>,
  onConfirm,
  confirmButtonText = "confirm",
  confirmButtonClasses = "bg-green-300 hover:bg-green-500",
}) {
  const cancelButtonRef = useRef(null);

  const onConfirmButtonClick = useCallback(() => {
    setIsOpen(false);
    onConfirm();
  }, [onConfirm, setIsOpen]);

  if (!isOpen) return null;

  return (
    <Transition.Root show={isOpen} as={Fragment} className={exo2.className}>
      <Dialog
        as="div"
        className="relative z-30"
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
          <div className="fixed inset-0 bg-disabled-200/75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full justify-center text-center items-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-background text-left shadow-xl transition-all my-8 w-full max-w-lg text-general">
                <div className="p-4 bg-[#fffce9]">
                  <div className="flex items-start">
                    <div className="flex flex-shrink-0 items-center justify-center mx-0 h-10 w-10 text-2xl">
                      {/* <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" /> */}
                      <FontAwesomeIcon icon={icon}></FontAwesomeIcon>
                    </div>
                    <div className="ml-2 py-2 text-left">
                      <Dialog.Title
                        as="h3"
                        className="text-base font-semibold leading-6 uppercase"
                      >
                        {title || "confirm action"}
                      </Dialog.Title>
                      <div className="mt-2 text-base leading-tight">{body}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-background py-3 flex flex-row-reverse justify-between px-10">
                  <button
                    type="button"
                    className={`inline-flex justify-center items-center rounded-full px-5 py-1 text-sm font-semibold shadow-md ml-3 w-auto disabled:bg-gray-400 uppercase ${confirmButtonClasses}`}
                    onClick={onConfirmButtonClick}
                  >
                    {confirmButtonText}
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center items-center rounded-full px-5 py-1 text-sm font-semibold shadow-md ring-1 ring-inset ring-general hover:bg-gray-50 mt-0 w-auto uppercase"
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
  );
}
