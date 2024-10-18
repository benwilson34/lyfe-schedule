// This only has "helpers" in the module name to prevent Jest from picking it up as a test file.
// see https://bengry.medium.com/testing-dates-and-timezones-using-jest-10a6a6ecf375
import timezonedDate from "timezoned-date";

export interface MockDateSetup {
  reset(): void;
  set(options: { offset?: number; isoDate?: string }): void;
}

const originalDate = Date;

export function setupMockDate(): MockDateSetup {
  function reset() {
    Date = originalDate;
  }

  function set({ isoDate, offset }: { offset?: number; isoDate?: string }) {
    const getMockDate = (): typeof import("mockdate") => {
      let MockDate: typeof import("mockdate") | undefined;
      jest.isolateModules(() => {
        MockDate = require("mockdate");
      });

      return MockDate!;
    };

    if (offset !== undefined) {
      Date = timezonedDate.makeConstructor(offset);
    }

    if (isoDate !== undefined) {
      getMockDate().set(isoDate);
    }
  }

  return { reset, set };
}
