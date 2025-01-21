import { SortMode } from "@/util/enums";
import {
  faCheck,
  faArrowDownShortWide,
  faArrowDownWideShort,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Listbox,
  Label,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";
import { Dispatch, SetStateAction } from "react";

export default function SortControls({
  selectedSort,
  setSelectedSort,
  showCompletedTaskControl = true,
  areCompletedTasksSortedFirst,
  toggleAreCompletedTasksSortedFirst,
  isSortAscending,
  toggleSortDirection,
}: {
  selectedSort: SortMode;
  setSelectedSort: Dispatch<SetStateAction<SortMode>>;
  showCompletedTaskControl?: boolean;
  areCompletedTasksSortedFirst?: boolean;
  toggleAreCompletedTasksSortedFirst?: () => void;
  isSortAscending: boolean;
  toggleSortDirection: () => void;
}) {
  return (
    <div className="flex items-center text-xs">
      <Listbox value={selectedSort} onChange={setSelectedSort}>
        <Label className="font-semibold">Sort:</Label>

        {showCompletedTaskControl && (
          <div
            onClick={toggleAreCompletedTasksSortedFirst}
            className={`ml-1 py-1 px-2 rounded-md border-2 ${
              areCompletedTasksSortedFirst
                ? "bg-general-500 text-ondark border-general-500"
                : "bg-transparent border-general-200"
            }`}
          >
            <FontAwesomeIcon icon={faCheck} />
          </div>
        )}

        <div className="inline-block relative ml-1">
          <ListboxButton className="relative cursor-default rounded-md border-2 border-general-200 py-1 px-2 text-left">
            <span className="flex items-center">
              <span className="block">{selectedSort}</span>
            </span>
          </ListboxButton>

          <ListboxOptions
            transition
            className="absolute z-10 mt-1 rounded-md bg-white py-1 shadow-lg whitespace-nowrap"
          >
            {Object.entries(SortMode).map(([sortModeKey, sortMode]) => (
              <ListboxOption
                key={sortModeKey}
                value={sortMode}
                className="group relative cursor-default select-none py-1 px-2 text-gray-900 data-[focus]:bg-accent data-[focus]:text-white"
              >
                <div className="flex items-center justify-between gap-x-2">
                  <span className="block group-data-[selected]:font-semibold">
                    {sortMode}
                  </span>

                  <span className="inset-y-0 flex items-center text-accent group-data-[focus]:text-white [.group:not([data-selected])_&]:hidden">
                    <FontAwesomeIcon icon={faCheck} />
                  </span>
                </div>
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>

      <div
        onClick={toggleSortDirection}
        className="ml-1 py-1 px-2 rounded-md border-2 border-general-200"
      >
        <FontAwesomeIcon
          icon={isSortAscending ? faArrowDownShortWide : faArrowDownWideShort}
        />
      </div>
    </div>
  );
}
