/**
 * @see https://tailwindui.com/components/marketing/elements/flyout-menus#component-911576fb54922e5199a9434ca8a273fd
 * 
 * @todo convert to Typescript
 */

import { Fragment } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis, faPenToSquare } from '@fortawesome/free-solid-svg-icons';

export default function TaskOptionsMenu({ task, onEditClick }) {
  return (
    <Popover className="relative">
      <Popover.Button className="inline-flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900">
        <FontAwesomeIcon icon={faEllipsis} className="text-gray-500" />
      </Popover.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute center-0 z-10 mt-5 flex w-screen max-w-max -translate-x-full px-4">
          <div className="w-screen max-w-xs flex-auto overflow-hidden rounded-lg bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5">
            <div className="p-1">
              {/* Each item */}
              <div onClick={onEditClick} className="group relative flex items-center gap-x-6 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                {/* <div className="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white"> */}
                  <FontAwesomeIcon icon={faPenToSquare} className="h-4 w-4 text-gray-600 group-hover:text-indigo-600" aria-hidden="true" />
                {/* </div> */}
                <div>
                  <span className="font-semibold text-gray-900">
                    Edit
                  </span>
                  {/* <p className="mt-1 text-gray-600">{item.description}</p> */}
                </div>
              </div>
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}
