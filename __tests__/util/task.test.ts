import { type TaskViewModel as Task } from "@/types/task.viewModel";
// not going to mock isPostponeAction
import dayjs from "@/lib/dayjs";
// not going to mock Dayjs
// not going to mock lodash
import MockCurrentDate from "mockdate";

// import the unit under test last to ensure mocks are put in place
import {
  calculateRangeDays,
  getLastPostponeUntilDate,
  isPostponeDateValid,
  sortTasksByEndDate,
  sortTasksByRange,
  sortTasksByRepeatInterval,
  sortTasksByStartDate,
  sortTasksByTimeEstimate,
} from "@/util/task";
import { Action, PostponeAction } from "@/types/task.dto";

describe("utils/task module", () => {
  describe("calculateRangeDays", () => {
    it("returns 1 when the startDate and endDate are the same", () => {
      const date = dayjs("2024-10-01");
      const result = calculateRangeDays(date, date);
      expect(result).toBe(1);
    });

    it("returns the calculated range when startDate and endDate are different", () => {
      const startDate = dayjs("2024-10-01");
      const endDate = dayjs("2024-10-05");
      const result = calculateRangeDays(startDate, endDate);
      expect(result).toBe(5);
    });
  });

  describe("getLastPostponeUntilDate", () => {
    it("returns undefined when there are no actions", () => {
      const mockTask: Partial<Task> = {};
      const result = getLastPostponeUntilDate(mockTask as Task);
      expect(result).toBeUndefined();
    });

    it("returns undefined when there are actions, but no postponements", () => {
      const mockTask: Partial<Task> = {
        actions: [
          {
            timestamp: new Date("2024-10-01"),
            mockActionTitle: "not a postponement",
          } as Action,
        ],
      };
      const result = getLastPostponeUntilDate(mockTask as Task);
      expect(result).toBeUndefined();
    });

    it("returns the postponeUntilDate of the most recent postponement", () => {
      const mockLastPostponeUntilDate = new Date("2024-10-25");
      const mockTask: Partial<Task> = {
        actions: [
          {
            timestamp: new Date("2024-10-01"),
            mockActionTitle: "not a postponement",
          } as Action,
          {
            timestamp: new Date("2024-10-02"),
            postponeUntilDate: new Date("2024-10-20"),
          } as PostponeAction,
          {
            timestamp: new Date("2024-10-03"),
            postponeUntilDate: mockLastPostponeUntilDate,
          } as PostponeAction,
          {
            timestamp: new Date("2024-10-04"),
            mockActionTitle: "not a postponement",
          } as Action,
        ],
      };
      const result = getLastPostponeUntilDate(mockTask as Task);
      expect(result).toBe(mockLastPostponeUntilDate);
    });
  });

  describe("isPostponeDateValid", () => {
    beforeEach(() => {
      MockCurrentDate.reset();
    });

    it("returns false when the postpone day is not after the current date", () => {
      MockCurrentDate.set("2024-10-05");
      const task: Partial<Task> = {
        startDate: dayjs("2024-10-03"),
      };
      const postponeDay = new Date("2024-10-04");
      const result = isPostponeDateValid(task as Task, postponeDay);
      expect(result).toBe(false);
    });

    it("returns false when the postpone day is not after the task start date", () => {
      MockCurrentDate.set("2024-10-05");
      const task: Partial<Task> = {
        startDate: dayjs("2024-10-07"),
      };
      const postponeDay = new Date("2024-10-06");
      const result = isPostponeDateValid(task as Task, postponeDay);
      expect(result).toBe(false);
    });

    it("returns false when the postpone day is not after the task's last postponeUntilDate", () => {
      MockCurrentDate.set("2024-10-05");
      const task: Partial<Task> = {
        startDate: dayjs("2024-10-03"),
        actions: [
          {
            timestamp: new Date("2024-10-01"),
            postponeUntilDate: new Date("2024-10-08"),
          } as PostponeAction
        ],
      };
      const postponeDay = new Date("2024-10-06");
      const result = isPostponeDateValid(task as Task, postponeDay);
      expect(result).toBe(false);
    });

    it("returns true when the postpone day is valid", () => {
      MockCurrentDate.set("2024-10-05");
      const task: Partial<Task> = {
        startDate: dayjs("2024-10-03"),
      };
      const postponeDay = new Date("2024-10-06");
      const result = isPostponeDateValid(task as Task, postponeDay);
      expect(result).toBe(true);
    });

    it("returns true when the postpone day is valid, even when the task has been postponed before", () => {
      MockCurrentDate.set("2024-10-05");
      const task: Partial<Task> = {
        startDate: dayjs("2024-10-03"),
        actions: [
          {
            timestamp: new Date("2024-10-01"),
            postponeUntilDate: new Date("2024-10-07"),
          } as PostponeAction
        ],
      };
      const postponeDay = new Date("2024-10-08");
      const result = isPostponeDateValid(task as Task, postponeDay);
      expect(result).toBe(true);
    });
  });

  describe("sortTasksByStartDate", () => {
    it("sorts tasks", () => {
      const unsortedArray: Partial<Task>[] = [
        { startDate: dayjs("2024-10-03") },
        { startDate: dayjs("2024-10-01") },
        { startDate: dayjs("2024-10-08") },
        { startDate: dayjs("2024-10-02") },
        { startDate: dayjs("2024-10-06") },
      ];
      const expectedArray: Partial<Task>[] = [
        { startDate: dayjs("2024-10-01") },
        { startDate: dayjs("2024-10-02") },
        { startDate: dayjs("2024-10-03") },
        { startDate: dayjs("2024-10-06") },
        { startDate: dayjs("2024-10-08") },
      ];
      // need to clone unsortedArray since `Array.sort` mutates the input array
      const resultArray = ([...unsortedArray] as Task[]).sort(
        sortTasksByStartDate
      );
      const getStartDateValue = (e: Task) => e.startDate.valueOf();
      expect(resultArray.map(getStartDateValue)).toEqual(
        (expectedArray as Task[]).map(getStartDateValue)
      );
    });
  });

  describe("sortTasksByEndDate", () => {
    it("sorts tasks", () => {
      const unsortedArray: Partial<Task>[] = [
        { endDate: dayjs("2024-10-03") },
        { endDate: dayjs("2024-10-01") },
        { endDate: dayjs("2024-10-08") },
        { endDate: dayjs("2024-10-02") },
        { endDate: dayjs("2024-10-06") },
      ];
      const expectedArray: Partial<Task>[] = [
        { endDate: dayjs("2024-10-01") },
        { endDate: dayjs("2024-10-02") },
        { endDate: dayjs("2024-10-03") },
        { endDate: dayjs("2024-10-06") },
        { endDate: dayjs("2024-10-08") },
      ];
      // need to clone unsortedArray since `Array.sort` mutates the input array
      const resultArray = ([...unsortedArray] as Task[]).sort(
        sortTasksByEndDate
      );
      const getEndDateValue = (e: Task) => e.endDate.valueOf();
      expect(resultArray.map(getEndDateValue)).toEqual(
        (expectedArray as Task[]).map(getEndDateValue)
      );
    });
  });

  describe("sortTasksByRange", () => {
    it("sorts tasks", () => {
      const unsortedArray: Partial<Task>[] = [
        { rangeDays: 3 },
        { rangeDays: 1 },
        { rangeDays: 8 },
        { rangeDays: 2 },
        { rangeDays: 6 },
      ];
      const expectedArray: Partial<Task>[] = [
        { rangeDays: 1 },
        { rangeDays: 2 },
        { rangeDays: 3 },
        { rangeDays: 6 },
        { rangeDays: 8 },
      ];
      // need to clone unsortedArray since `Array.sort` mutates the input array
      const resultArray = ([...unsortedArray] as Task[]).sort(sortTasksByRange);
      expect(resultArray).toEqual(expectedArray);
    });
  });

  describe("sortTasksByTimeEstimate", () => {
    it("sorts tasks that all have time estimate", () => {
      const unsortedArray: Partial<Task>[] = [
        { timeEstimateMins: 30 },
        { timeEstimateMins: 0 },
        { timeEstimateMins: 15 },
        { timeEstimateMins: 80 },
        { timeEstimateMins: 5 },
        { timeEstimateMins: 15 },
      ];
      const expectedArray: Partial<Task>[] = [
        { timeEstimateMins: 0 },
        { timeEstimateMins: 5 },
        { timeEstimateMins: 15 },
        { timeEstimateMins: 15 },
        { timeEstimateMins: 30 },
        { timeEstimateMins: 80 },
      ];
      // need to clone unsortedArray since `Array.sort` mutates the input array
      const resultArray = ([...unsortedArray] as Task[]).sort(
        sortTasksByTimeEstimate
      );
      expect(resultArray).toEqual(expectedArray);
    });

    it("sorts tasks with no time estimate first", () => {
      const unsortedArray: Partial<Task>[] = [
        { timeEstimateMins: 60 },
        {},
        { timeEstimateMins: 15 },
        { timeEstimateMins: 80 },
        {},
        { timeEstimateMins: 15 },
      ];
      const expectedArray: Partial<Task>[] = [
        {},
        {},
        { timeEstimateMins: 15 },
        { timeEstimateMins: 15 },
        { timeEstimateMins: 60 },
        { timeEstimateMins: 80 },
      ];
      // need to clone unsortedArray since `Array.sort` mutates the input array
      const resultArray = ([...unsortedArray] as Task[]).sort(
        sortTasksByTimeEstimate
      );
      expect(resultArray).toEqual(expectedArray);
    });
  });

  describe("sortTasksByRepeatInterval", () => {
    it("sorts tasks that all have repeat interval", () => {
      const unsortedArray: Partial<Task>[] = [
        { repeatDays: 30 },
        { repeatDays: 0 },
        { repeatDays: 15 },
        { repeatDays: 80 },
        { repeatDays: 5 },
        { repeatDays: 15 },
      ];
      const expectedArray: Partial<Task>[] = [
        { repeatDays: 0 },
        { repeatDays: 5 },
        { repeatDays: 15 },
        { repeatDays: 15 },
        { repeatDays: 30 },
        { repeatDays: 80 },
      ];
      // need to clone unsortedArray since `Array.sort` mutates the input array
      const resultArray = ([...unsortedArray] as Task[]).sort(
        sortTasksByRepeatInterval
      );
      expect(resultArray).toEqual(expectedArray);
    });

    it("sorts tasks with no repeat interval first", () => {
      const unsortedArray: Partial<Task>[] = [
        { repeatDays: 60 },
        {},
        { repeatDays: 15 },
        { repeatDays: 80 },
        {},
        { repeatDays: 15 },
      ];
      const expectedArray: Partial<Task>[] = [
        {},
        {},
        { repeatDays: 15 },
        { repeatDays: 15 },
        { repeatDays: 60 },
        { repeatDays: 80 },
      ];
      // need to clone unsortedArray since `Array.sort` mutates the input array
      const resultArray = ([...unsortedArray] as Task[]).sort(
        sortTasksByRepeatInterval
      );
      expect(resultArray).toEqual(expectedArray);
    });
  });
});
